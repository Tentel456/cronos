"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
	const t = useTranslations("login");
	const router = useRouter();
	const currentLocale = useLocale();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [rememberMe, setRememberMe] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) throw error;

			if (data.user) {
				router.push(`/${currentLocale}/dashboard`);
			}
		} catch (error: any) {
			setError(error.message || "Login failed");
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		try {
			const { error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: `${window.location.origin}/auth/callback`,
				},
			});

			if (error) throw error;
		} catch (error: any) {
			setError(error.message || "Google sign in failed");
		}
	};

	return (
		<div className="flex min-h-screen">
			{/* Left side - Form */}
			<div className="w-1/2 bg-[#D4CFC9] flex items-center justify-center p-12">
				<div className="w-full max-w-md">
					<h1 className="text-4xl font-bold text-[#260A2F] mb-2">
						Welcome Back!
					</h1>
					<p className="text-[#260A2F] mb-8">
						Enter your credentials to access your account
					</p>

					{error && (
						<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label className="block text-sm text-[#260A2F] mb-2">
								Email address
							</label>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Enter your email"
								className="w-full px-4 py-3 rounded-lg bg-transparent border border-[#260A2F] text-[#260A2F] placeholder:text-[#260A2F]/50 focus:outline-none focus:ring-2 focus:ring-[#260A2F]"
								required
							/>
						</div>

						<div>
							<div className="flex justify-between items-center mb-2">
								<label className="block text-sm text-[#260A2F]">
									Password
								</label>
								<Link
									href="/forgot-password"
									className="text-sm text-[#260A2F] hover:underline">
									forgot password?
								</Link>
							</div>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••"
								className="w-full px-4 py-3 rounded-lg bg-transparent border border-[#260A2F] text-[#260A2F] placeholder:text-[#260A2F]/50 focus:outline-none focus:ring-2 focus:ring-[#260A2F]"
								required
							/>
						</div>

						<div className="flex items-center">
							<input
								type="checkbox"
								id="remember"
								checked={rememberMe}
								onChange={(e) => setRememberMe(e.target.checked)}
								className="w-4 h-4 rounded border-[#260A2F]"
							/>
							<label
								htmlFor="remember"
								className="ml-2 text-sm text-[#260A2F]">
								Remember for 30 days
							</label>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full py-3 bg-[#4A7C59] text-white rounded-lg font-semibold hover:bg-[#3d6449] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
							{loading ? "Logging in..." : "Log In"}
						</button>
					</form>

					<div className="flex items-center my-6">
						<div className="flex-1 border-t border-[#260A2F]"></div>
						<span className="px-4 text-sm text-[#260A2F]">or</span>
						<div className="flex-1 border-t border-[#260A2F]"></div>
					</div>

					<button
						onClick={handleGoogleSignIn}
						className="w-full py-3 bg-white border border-[#260A2F] rounded-lg font-semibold text-[#260A2F] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M19.8055 10.2292C19.8055 9.55056 19.7501 8.86667 19.6306 8.19861H10.2002V12.0492H15.6014C15.3773 13.2911 14.6571 14.3898 13.6025 15.0875V17.5866H16.8251C18.7173 15.8449 19.8055 13.2728 19.8055 10.2292Z" fill="#4285F4"/>
							<path d="M10.2002 20.0006C12.9516 20.0006 15.2727 19.1151 16.8296 17.5865L13.607 15.0874C12.7096 15.6972 11.5521 16.0428 10.2047 16.0428C7.54356 16.0428 5.28217 14.2828 4.47942 11.9165H1.15479V14.4923C2.74577 17.8695 6.30301 20.0006 10.2002 20.0006Z" fill="#34A853"/>
							<path d="M4.47475 11.9163C4.0434 10.6744 4.0434 9.33008 4.47475 8.08818V5.51233H1.15479C-0.384931 8.66929 -0.384931 12.3352 1.15479 15.4921L4.47475 11.9163Z" fill="#FBBC04"/>
							<path d="M10.2002 3.95805C11.6253 3.936 13.0023 4.47247 14.036 5.45722L16.8929 2.60218C15.1814 0.990445 12.9296 0.0808105 10.2002 0.104376C6.30301 0.104376 2.74577 2.23548 1.15479 5.51234L4.47475 8.08819C5.27283 5.71658 7.53889 3.95805 10.2002 3.95805Z" fill="#EA4335"/>
						</svg>
						Sign in with Google
					</button>

					<p className="text-center text-sm text-[#260A2F] mt-6">
						Don't have an account?{" "}
						<Link href={`/${currentLocale}/register`} className="text-[#260A2F] font-semibold hover:underline">
							Register
						</Link>
					</p>
				</div>
			</div>

			{/* Right side - Image */}
			<div className="w-1/2 bg-black flex items-center justify-center relative overflow-hidden">
				<Image
					src="/register.png"
					alt="Login background"
					fill
					className="object-cover"
				/>
			</div>
		</div>
	);
}
