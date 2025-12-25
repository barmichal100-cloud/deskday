import Header from "@/app/Header";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header backHref="/" backText="Home" hideRoleSwitch={true} hideDashboard={true} />
      <div className="px-6 lg:px-20 py-12">
        <h1 className="text-4xl font-bold text-gray-900">Contact us</h1>
      </div>
    </div>
  );
}
