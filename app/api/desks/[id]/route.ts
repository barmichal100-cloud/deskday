import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateNewDeskInput } from '@/lib/validation2';
import { getCurrentUserId } from '@/lib/auth';
import { put } from '@vercel/blob';
import sharp from 'sharp';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // allow multipart updates (images + payload) or JSON updates
    const contentType = String(req.headers.get('content-type') ?? '');
    let body: Record<string, any> = {};
    const uploadedFiles: { url: string; filename: string; thumbnailSmall?: string }[] = [];

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const payloadRaw = form.get('payload');
      try {
        body = payloadRaw ? JSON.parse(String(payloadRaw)) : {};
      } catch (e) {
        return NextResponse.json({ error: 'Invalid payload JSON' }, { status: 400 });
      }

      const files = form.getAll('images');
      if (files.length > 0) {
        const MAX_IMAGES = 6;
        const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

        for (const f of files) {
          if (uploadedFiles.length >= MAX_IMAGES) break;
          try {
            if (!(f instanceof File) && !(f && typeof (f as any).arrayBuffer === 'function')) continue;
            const fileObj = f as File;
            const ftype = String((fileObj as any).type || '');
            const fsize = Number((fileObj as any).size || 0);
            if (!ALLOWED_TYPES.includes(ftype) || (fsize > MAX_IMAGE_SIZE && fsize > 0)) {
              console.warn('skipping invalid file', { name: fileObj.name, type: ftype, size: fsize });
              continue;
            }

            const buf = Buffer.from(await fileObj.arrayBuffer());
            const name = String(fileObj.name || 'upload').replace(/[^a-z0-9.\-]/gi, '_');
            const filename = `desk-${Date.now()}-${Math.random().toString(36).slice(2,8)}-${name}`;

            // Upload original image to Vercel Blob
            const blob = await put(filename, buf, {
              access: 'public',
              contentType: ftype,
            });

            // Generate thumbnails and upload them
            let thumbSmallUrl = blob.url;
            let thumbMediumUrl = blob.url;

            try {
              // Small thumbnail (400x300)
              const thumbSmallBuf = await sharp(buf)
                .resize(400, 300, { fit: 'cover' })
                .webp({ quality: 80 })
                .toBuffer();
              const thumbSmallBlob = await put(`thumb-400x300-${filename}.webp`, thumbSmallBuf, {
                access: 'public',
                contentType: 'image/webp',
              });
              thumbSmallUrl = thumbSmallBlob.url;

              // Medium thumbnail (800x600)
              const thumbMediumBuf = await sharp(buf)
                .resize(800, 600, { fit: 'cover' })
                .webp({ quality: 85 })
                .toBuffer();
              const thumbMediumBlob = await put(`thumb-800x600-${filename}.webp`, thumbMediumBuf, {
                access: 'public',
                contentType: 'image/webp',
              });
              thumbMediumUrl = thumbMediumBlob.url;
            } catch (err) {
              console.warn('thumbnail generation failed', err);
            }

            uploadedFiles.push({ url: blob.url, filename, thumbnailSmall: thumbSmallUrl });
          } catch (err) {
            console.warn('file upload failed', err);
          }
        }
      }
    } else {
      body = (await req.json()) as Record<string, unknown>;
    }

    const ownerId = await getCurrentUserId(req);
    if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Ensure desk exists and belongs to current user
    const desk = await prisma.desk.findUnique({ where: { id } });
    if (!desk) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (desk.ownerId !== ownerId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Optionally remove photos specified by client
    const removeIds: string[] = Array.isArray(body.removePhotoIds) ? body.removePhotoIds : [];

    // create new DeskPhoto entries for uploadedFiles
    const photosToCreate = uploadedFiles.map((f, idx) => ({ url: f.url, order: idx, thumbnailUrl: f.thumbnailSmall }));

    // Validate that there will be at least 1 image after the update
    const currentPhotos = await prisma.deskPhoto.findMany({ where: { deskId: desk.id } });
    const totalImagesAfterUpdate = currentPhotos.filter(p => !removeIds.includes(p.id)).length + photosToCreate.length;

    // Validate payload (reuse existing validator)
    const result = await validateNewDeskInput({
      title: body.title,
      city: body.city,
      country: body.country,
      address: body.address,
      description: body.description,
      pricePerDay: body.pricePerDay,
      currency: body.currency,
    });

    // Collect all validation errors including images
    if (!result.ok) {
      const errors = "errors" in result && result.errors ? { ...result.errors as Record<string, string> } : {} as Record<string, string>;

      // Add images error if no photos will remain after update
      if (totalImagesAfterUpdate === 0) {
        errors.images = "At least 1 image is required";
      }

      // Return all errors together
      return NextResponse.json({
        error: result.error ?? "Validation failed",
        errors
      }, { status: 400 });
    }

    // Also check images even if other validation passed
    if (totalImagesAfterUpdate === 0) {
      return NextResponse.json({ error: "Validation failed", errors: { images: "At least 1 image is required" } }, { status: 400 });
    }

    const data = result.data;

    // Delete photos after validation passes
    if (removeIds.length > 0) {
      await prisma.deskPhoto.deleteMany({ where: { id: { in: removeIds }, deskId: desk.id } });
    }

    // Parse available dates from body (array of ISO date strings)
    const availableDates: string[] = Array.isArray(body.availableDates) ? body.availableDates : [];
    console.log('Available dates from body:', availableDates.length, 'dates');

    // Deduplicate dates first
    const uniqueDates = Array.from(new Set(availableDates));
    console.log('Unique dates after deduplication:', uniqueDates.length, 'dates');

    // Create date objects for Prisma
    const availableDatesToCreate = uniqueDates
      .map(dateStr => {
        try {
          // Validate format
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            console.warn('Invalid date format:', dateStr);
            return null;
          }
          // Parse as ISO date string - Prisma will handle DATE type conversion
          const date = new Date(dateStr + 'T00:00:00.000Z');
          if (isNaN(date.getTime())) {
            console.warn('Invalid date value:', dateStr);
            return null;
          }
          return { date };
        } catch (err) {
          console.warn('Error parsing date:', dateStr, err);
          return null;
        }
      })
      .filter((item): item is { date: Date } => item !== null);

    console.log('Will update with', availableDatesToCreate.length, 'available date records');

    // Parse amenities from body
    const amenities = body.amenities || null;

    // Use a transaction to delete old dates and create new ones atomically
    const updated = await prisma.$transaction(async (tx) => {
      // Delete all existing available dates
      await tx.deskAvailableDate.deleteMany({ where: { deskId: desk.id } });

      // Update desk and create new available dates
      return await tx.desk.update({
        where: { id },
        data: {
          title_en: data.title_en,
          description_en: data.description_en,
          address: data.address,
          city: data.city,
          country: data.country,
          pricePerDay: data.pricePerDay ?? 0,
          currency: data.currency,
          amenities: amenities,
          photos:
            photosToCreate.length > 0
              ? { create: photosToCreate }
              : undefined,
          availableDates: availableDatesToCreate.length > 0 ? { create: availableDatesToCreate } : undefined,
        },
        include: {
          photos: true,
          availableDates: true
        },
      });
    });

    return NextResponse.json({ desk: updated }, { status: 200 });
  } catch (err) {
    console.error('update desk error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ownerId = await getCurrentUserId(req);
    if (!ownerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const desk = await prisma.desk.findUnique({ where: { id } });
    if (!desk) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (desk.ownerId !== ownerId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.desk.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('delete desk error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
