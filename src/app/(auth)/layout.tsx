export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cocoa-800 via-cocoa-900 to-driftwood-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Maruthi Enterprises
          </h1>
          <p className="mt-2 text-pearl-400">Recovery Agency Management</p>
        </div>
        <div className="bg-white rounded-xl shadow-2xl p-8">{children}</div>
      </div>
    </div>
  );
}
