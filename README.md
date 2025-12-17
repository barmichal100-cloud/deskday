This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Uploaded images (development)

When you add photos for a desk in development (the Add a new desk form), uploaded files are saved under `public/uploads` and served by Next.js as static assets at `/uploads/<filename>`.

Be mindful that `public/uploads` is intended for local development only — in production you should configure a proper object store (S3, Azure, etc.) and update the API handler accordingly.

Crop & thumbnails
------------------
The uploader supports client-side cropping (react-easy-crop) and the server generates optimized thumbnails (webp) during upload using `sharp`.

If you updated the Prisma schema (DeskPhoto.thumbnailUrl) you'll need to create and apply a migration before starting the app:

```bash
npx prisma migrate dev --name add-deskphoto-thumbnail
npx prisma generate
```

Note: `sharp` is a native dependency; installing it may require build tools on your platform. On Windows, ensure you have the latest Node.js and build tooling required by the package.
