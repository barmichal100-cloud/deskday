import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateNewDeskInput } from '@/lib/validation2';
import { getCurrentUserId } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';
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
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        for (const f of files) {
          if (uploadedFiles.length >= MAX_IMAGES) break;
          try {
            if (!(f instanceof File) && !(f && typeof (f as any).arrayBuffer === 'function')) continue;
            const fileObj = f as File;
            const ftype = String((fileObj as any).type || '');
            const fsize = Number((fileObj as any).size || 0);
            if (!ALLOWED_TYPES.includes(ftype) || (fsize > MAX_IMAGE_SIZE && fsize > 0)) continue;
            const buf = Buffer.from(await fileObj.arrayBuffer());
            const name = String(fileObj.name || 'upload').replace(/[^a-z0-9.\-]/gi, '_');
            const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${name}`;
            const dest = path.join(uploadDir, filename);
            await fs.writeFile(dest, buf);

            const thumbSmall = `thumb-400x300-${filename}.webp`;
            try {
              await sharp(buf).resize(400, 300, { fit: 'cover' }).webp({ quality: 80 }).toFile(path.join(uploadDir, thumbSmall));
            } catch (err) {
              console.warn('thumbnail creation failed for update', err);
            }

            uploadedFiles.push({ url: `/uploads/${filename}`, filename, thumbnailSmall: `/uploads/${thumbSmall}` });
          } catch (err) {
            console.warn('file save failed', err);
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

    if (!result.ok) {
      const payload: Record<string, any> = { error: result.error ?? 'Validation failed' };
      if ('errors' in result && result.errors) payload.errors = result.errors;
      return NextResponse.json(payload, { status: 400 });
    }

    const data = result.data;

    // Optionally remove photos specified by client
    const removeIds: string[] = Array.isArray(body.removePhotoIds) ? body.removePhotoIds : [];
    if (removeIds.length > 0) {
      await prisma.deskPhoto.deleteMany({ where: { id: { in: removeIds }, deskId: desk.id } });
    }

    // create new DeskPhoto entries for uploadedFiles
    const photosToCreate = uploadedFiles.map((f, idx) => ({ url: f.url, order: idx, thumbnailUrl: f.thumbnailSmall }));

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
