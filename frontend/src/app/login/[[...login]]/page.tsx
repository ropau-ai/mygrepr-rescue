import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
      />
    </main>
  );
}
