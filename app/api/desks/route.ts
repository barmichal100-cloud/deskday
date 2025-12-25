// app/api/desks/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateNewDeskInput } from "@/lib/validation2";
import { getCurrentUserId } from "@/lib/auth";
import { put } from "@vercel/blob";
import sharp from "sharp";

export async function POST(req: Request) {
  try {
    // support both application/json and multipart/form-data payloads
    const contentType = String(req.headers.get('content-type') ?? '');
    let body: Record<string, any> = {};
    let uploadedFiles: { url: string; filename: string }[] = [];

    if (contentType.includes('multipart/form-data')) {
      // parse FormData and extract 'payload' (json) and files under 'images[]' or 'images'
      const form = await req.formData();
      const payloadRaw = form.get('payload');
      try {
        body = payloadRaw ? JSON.parse(String(payloadRaw)) : {};
      } catch (e) {
        return NextResponse.json({ error: 'Invalid payload JSON' }, { status: 400 });
      }

      // handle file uploads with Vercel Blob
      const files = form.getAll('images');
      if (files.length > 0) {
        const MAX_IMAGES = 6;
        const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

        for (const f of files) {
          if (uploadedFiles.length >= MAX_IMAGES) break;
          try {
            if (!(f instanceof File) && !(f && typeof (f as any).arrayBuffer === 'function')) continue;
            const fileObj = f as File;

            // validate type/size
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

            uploadedFiles.push({
              url: blob.url,
              filename,
              thumbnailSmall: thumbSmallUrl,
              thumbnailMedium: thumbMediumUrl,
            } as any);
          } catch (err) {
            console.warn('file upload failed', err);
          }
        }
      }
    } else {
      body = (await req.json()) as Record<string, unknown>;
    }

    // Basic auth: resolve current user id from header or DEV_USER_ID in dev
    const ownerId = await getCurrentUserId(req);
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      // If validator returned field errors, include them in response
      const payload: Record<string, unknown> = { error: result.error ?? "Validation failed" };
      if ("errors" in result && result.errors) payload.errors = result.errors;
      return NextResponse.json(payload, { status: 400 });
    }

    const data = result.data;

    // Build desk create input and attach any uploaded files as DeskPhoto entries
    const photosToCreate = uploadedFiles.map((f, idx) => ({ url: f.url, order: idx, thumbnailUrl: (f as any).thumbnailSmall }));
    console.log('Photos to create:', photosToCreate.length, 'photos');

    // Require at least 1 image
    if (photosToCreate.length === 0) {
      return NextResponse.json({ error: "Validation failed", errors: { images: "At least 1 image is required." } }, { status: 400 });
    }

    // Parse available dates from body (array of ISO date strings)
    const availableDates: string[] = Array.isArray(body.availableDates) ? body.availableDates : [];
    console.log('Available dates from body:', availableDates.length, 'dates');

    // Create date objects for Prisma
    const availableDatesToCreate = availableDates
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

    console.log('Will create', availableDatesToCreate.length, 'available date records');

    const desk = await prisma.desk.create({
      data: {
        ownerId: ownerId,
        title_en: data.title_en,
        city: data.city,
        country: data.country,
        address: data.address,
        description_en: data.description_en,
        pricePerDay: data.pricePerDay ?? 0,
        currency: data.currency,
        amenities: {}, // TODO: expand later
        isActive: true,
        photos: photosToCreate.length > 0 ? { create: photosToCreate } : undefined,
        availableDates: availableDatesToCreate.length > 0 ? { create: availableDatesToCreate } : undefined,
      },
      include: {
        photos: true,
        availableDates: true
      },
    });

    return NextResponse.json({ desk }, { status: 201 });
  } catch (err) {
    console.error("Error creating desk:", err);
    // Temporarily expose error details for debugging
    const detail = err instanceof Error ? {
      name: err.name,
      message: err.message,
      stack: err.stack
    } : { detail: String(err) };
    return NextResponse.json({
      error: "Internal server error while creating desk.",
      detail
    }, { status: 500 });
  }
}
