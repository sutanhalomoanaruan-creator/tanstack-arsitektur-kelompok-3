import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Flower2, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import type { FormEvent, PointerEvent } from "react";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/login")({
	component: LoginPage,
	head: () => ({
		meta: [
			{ title: "Masuk atau Daftar — Kain & Kebaya" },
			{
				name: "description",
				content: "Masuk atau buat akun Kain & Kebaya untuk melanjutkan perjalanan Anda.",
			},
		],
	}),
});

function LoginPage() {
	const navigate = useNavigate();
	const cardRef = useRef<HTMLElement>(null);
	const [isSignUp, setIsSignUp] = useState(false);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);

	const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
		if (event.pointerType !== "mouse" || !cardRef.current) return;
		const bounds = event.currentTarget.getBoundingClientRect();
		const x = (event.clientX - bounds.left) / bounds.width - 0.5;
		const y = (event.clientY - bounds.top) / bounds.height - 0.5;
		cardRef.current.style.setProperty("--tilt-x", `${x * 8}deg`);
		cardRef.current.style.setProperty("--tilt-y", `${y * -8}deg`);
	};

	const resetTilt = () => {
		cardRef.current?.style.setProperty("--tilt-x", "0deg");
		cardRef.current?.style.setProperty("--tilt-y", "0deg");
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		setIsSuccess(false);
		setIsSubmitting(true);

		try {
			const result = isSignUp
				? await authClient.signUp.email({ name, email, password })
				: await authClient.signIn.email({ email, password });

			if (result.error) {
				setError(result.error.message || "Autentikasi belum berhasil. Silakan coba lagi.");
				return;
			}

			setIsSuccess(true);
			await new Promise((resolve) => window.setTimeout(resolve, 850));
			await navigate({ to: "/products" });
		} catch (submitError) {
			setError(
				submitError instanceof Error
					? submitError.message
					: "Terjadi kesalahan saat menghubungkan akun Anda.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const changeMode = (signUp: boolean) => {
		setIsSignUp(signUp);
		setError("");
		setIsSuccess(false);
	};

	return (
		<main className="auth-page">
			<div className="auth-layout">
				<section className="auth-story" aria-label="Tentang Kain & Kebaya">
					<div className="auth-story-copy">
						<p className="auth-eyebrow">
							<Flower2 size={15} aria-hidden="true" />
							Warisan dalam setiap jahitan
						</p>
						<h1>
							Keanggunan
							<br />
							yang <em>bercerita.</em>
						</h1>
						<p className="auth-story-description">
							Temukan keindahan busana Nusantara yang dirangkai dengan hati, untuk momen yang layak
							dikenang.
						</p>
						<div className="auth-story-note">
							<span className="auth-note-icon">
								<Sparkles size={17} aria-hidden="true" />
							</span>
							<span>
								<strong>Rasa istimewa, dari pertama kali.</strong>
								<span>Selamat datang di Kain &amp; Kebaya.</span>
							</span>
						</div>
					</div>
					<div className="auth-orbit auth-orbit-one" aria-hidden="true" />
					<div className="auth-orbit auth-orbit-two" aria-hidden="true" />
					<div className="auth-textile" aria-hidden="true">
						<div className="auth-textile-ornament">✳</div>
						<div className="auth-textile-caption">Seni yang dikenakan</div>
					</div>
				</section>

				<section className="auth-panel" aria-label={isSignUp ? "Daftar akun" : "Masuk"}>
					<div className="auth-panel-heading">
						<span className="auth-brand-mark">
							<Flower2 size={20} aria-hidden="true" />
						</span>
						<p>KAIN &amp; KEBAYA</p>
					</div>
					<div
						className="auth-card-stage"
						onPointerMove={handlePointerMove}
						onPointerLeave={resetTilt}
					>
						<article
							ref={cardRef}
							className={`auth-card${isSignUp ? " is-flipped" : ""}`}
							aria-live="polite"
						>
							<div
								className="auth-card-face auth-card-front"
								aria-hidden={isSignUp}
								inert={isSignUp}
							>
								<div className="auth-card-heading">
									<p className="auth-kicker">SENANG BERTEMU KEMBALI</p>
									<h2>Selamat datang.</h2>
									<p>Masuk untuk melanjutkan cerita Anda bersama kami.</p>
								</div>
								<AuthForm
									mode="signin"
									email={email}
									password={password}
									name={name}
									error={error}
									isSubmitting={isSubmitting}
									isSuccess={isSuccess}
									onEmailChange={setEmail}
									onPasswordChange={setPassword}
									onNameChange={setName}
									onSubmit={handleSubmit}
									onModeChange={changeMode}
								/>
							</div>
							<div
								className="auth-card-face auth-card-back"
								aria-hidden={!isSignUp}
								inert={!isSignUp}
							>
								<div className="auth-card-heading">
									<p className="auth-kicker">MULAI PERJALANAN BARU</p>
									<h2>Jadi bagian kami.</h2>
									<p>Buat akun untuk menyimpan keranjang dan pesanan Anda.</p>
								</div>
								<AuthForm
									mode="signup"
									email={email}
									password={password}
									name={name}
									error={error}
									isSubmitting={isSubmitting}
									isSuccess={isSuccess}
									onEmailChange={setEmail}
									onPasswordChange={setPassword}
									onNameChange={setName}
									onSubmit={handleSubmit}
									onModeChange={changeMode}
								/>
							</div>
						</article>
					</div>
					<p className="auth-panel-footer">
						<span>Busana Nusantara, dirangkai dengan cinta.</span>
						<ArrowRight size={14} aria-hidden="true" />
					</p>
				</section>
			</div>
		</main>
	);
}

type AuthFormProps = {
	mode: "signin" | "signup";
	name: string;
	email: string;
	password: string;
	error: string;
	isSubmitting: boolean;
	isSuccess: boolean;
	onNameChange: (value: string) => void;
	onEmailChange: (value: string) => void;
	onPasswordChange: (value: string) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	onModeChange: (isSignUp: boolean) => void;
};

function AuthForm({
	mode,
	name,
	email,
	password,
	error,
	isSubmitting,
	isSuccess,
	onNameChange,
	onEmailChange,
	onPasswordChange,
	onSubmit,
	onModeChange,
}: AuthFormProps) {
	const isSignUp = mode === "signup";

	return (
		<form
			className={`auth-form${error ? " is-shaking" : ""}${isSuccess ? " is-success" : ""}`}
			onSubmit={onSubmit}
			aria-busy={isSubmitting}
		>
			{isSignUp && (
				<label className="auth-field">
					<input
						autoComplete="name"
						name="name"
						type="text"
						value={name}
						onChange={(event) => onNameChange(event.target.value)}
						placeholder=" "
						required
					/>
					<span>Nama lengkap</span>
				</label>
			)}
			<label className="auth-field">
				<input
					autoComplete="email"
					name="email"
					type="email"
					value={email}
					onChange={(event) => onEmailChange(event.target.value)}
					placeholder=" "
					required
				/>
				<span>Alamat email</span>
			</label>
			<label className="auth-field">
				<input
					autoComplete={isSignUp ? "new-password" : "current-password"}
					name="password"
					type="password"
					value={password}
					onChange={(event) => onPasswordChange(event.target.value)}
					placeholder=" "
					minLength={8}
					required
				/>
				<span>Kata sandi</span>
			</label>
			{error && (
				<p className="auth-error" role="alert">
					{error}
				</p>
			)}
			<button className="auth-submit" type="submit" disabled={isSubmitting}>
				<span>{isSubmitting ? "Memeriksa akun..." : isSignUp ? "Buat akun" : "Masuk"}</span>
				{isSubmitting ? (
					<span className="auth-spinner" aria-hidden="true" />
				) : (
					<ArrowRight size={17} aria-hidden="true" />
				)}
			</button>
			<p className="auth-switch">
				{isSignUp ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
				<button type="button" onClick={() => onModeChange(!isSignUp)}>
					{isSignUp ? "Masuk" : "Daftar"}
				</button>
			</p>
			{isSuccess && (
				<output className="auth-success" aria-live="polite">
					<span className="auth-success-check">
						<Check size={26} strokeWidth={2.5} aria-hidden="true" />
					</span>
					<strong>{isSignUp ? "Akun berhasil dibuat" : "Berhasil masuk"}</strong>
					<span>Anda akan segera diarahkan...</span>
				</output>
			)}
		</form>
	);
}
