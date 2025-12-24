import { prisma } from '@/lib/prisma';
import EditDeskForm from '../EditDeskForm';
import Header from '../../../../../Header';

type Props = { params: Promise<{ id: string }> };

export default async function EditPage({ params }: Props) {
  // Next 16 passes params as a Promise in the app router
  const { id } = await params;
  const desk = await prisma.desk.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { order: 'asc' } },
      availableDates: { orderBy: { date: 'asc' } }
    }
  });

  if (!desk) {
    return (
      <main className="min-h-screen bg-white">
        <Header backHref="/dashboard" backText="Dashboard" />
        <section className="px-6 lg:px-20 py-12">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">Desk not found</h1>
          <p className="text-sm text-gray-600">Could not find the desk you want to edit.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Header backHref="/dashboard" backText="Back to dashboard" />
      <section className="px-6 lg:px-20 py-12">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-8">Edit desk</h1>
        <EditDeskForm desk={desk} />
      </section>
    </main>
  );
}
