// app/api/desks/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateNewDeskInput } from "@/lib/validation2";
import { getCurrentUserId } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";
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

      // handle file uploads
      const files = form.getAll('images');
      if (files.length > 0) {
        const MAX_IMAGES = 6;
        const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });
        for (const f of files) {
          if (uploadedFiles.length >= MAX_IMAGES) break;
          try {
            // File-like objects from formData implement arrayBuffer()
            // Accept only File-like objects
            if (!(f instanceof File) && !(f && typeof (f as any).arrayBuffer === 'function')) continue;
            const fileObj = f as File;
            // validate type/size
            const ftype = String((fileObj as any).type || '');
            const fsize = Number((fileObj as any).size || 0);
            if (!ALLOWED_TYPES.includes(ftype) || (fsize > MAX_IMAGE_SIZE && fsize > 0)) {
              // skip invalid files
              console.warn('skipping invalid file', { name: fileObj.name, type: ftype, size: fsize });
              continue;
            }
            const buf = Buffer.from(await fileObj.arrayBuffer());
            // simple filename sanitization
            const name = String(fileObj.name || 'upload').replace(/[^a-z0-9.\-]/gi, '_');
            const filename = `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${name}`;
            const dest = path.join(uploadDir, filename);
            await fs.writeFile(dest, buf);
            const fileUrl = `/uploads/${filename}`;

            // generate thumbnails: small (400x300 webp) and medium (800x600 webp)
            const thumbSmall = `thumb-400x300-${filename}.webp`;
            const thumbMedium = `thumb-800x600-${filename}.webp`;
            try {
              await sharp(buf).resize(400, 300, { fit: 'cover' }).webp({ quality: 80 }).toFile(path.join(uploadDir, thumbSmall));
              await sharp(buf).resize(800, 600, { fit: 'cover' }).webp({ quality: 85 }).toFile(path.join(uploadDir, thumbMedium));
            } catch (err) {
              console.warn('thumbnail generation failed', err);
            }

            uploadedFiles.push({ url: fileUrl, filename });
            // attach thumbnail urls too (match index later)
            // we'll set the expected thumbnail filenames on the uploadedFiles map
            (uploadedFiles[uploadedFiles.length - 1] as any).thumbnailSmall = `/uploads/${thumbSmall}`;
            (uploadedFiles[uploadedFiles.length - 1] as any).thumbnailMedium = `/uploads/${thumbMedium}`;
          } catch (err) {
            console.warn('file save failed', err);
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
        pricePerDay: data.pricePerDay,
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
    // In development, return the error details to help debugging. In production keep it generic.
    // Return error name and stack to help local debugging. Remove or guard this before shipping.
    const detail = err instanceof Error ? { name: err.name, stack: err.stack } : { detail: String(err) };
    const devPayload =
      process.env.NODE_ENV === "production"
        ? { error: "Internal server error while creating desk." }
        : { error: "Internal server error while creating desk.", detail };
    return NextResponse.json(devPayload, { status: 500 });
  }
}
