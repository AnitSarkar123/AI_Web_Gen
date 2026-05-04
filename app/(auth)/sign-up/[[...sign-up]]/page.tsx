import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100dvh-7rem)] items-center justify-center">
      <SignUp forceRedirectUrl="/" />
    </div>
  );
}
