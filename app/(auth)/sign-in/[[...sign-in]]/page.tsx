import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100dvh-7rem)] items-center justify-center">
      <SignIn forceRedirectUrl="/" />
    </div>
  );
}
