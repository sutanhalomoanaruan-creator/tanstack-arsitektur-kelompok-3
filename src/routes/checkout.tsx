import { useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { useCart } from "@/components/storefront/cart-context";
import { getServerSession } from "@/lib/server/auth";
import { createOrder } from "@/lib/server/orders";
import { formatRupiah } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
	beforeLoad: async () => {
		const { session } = await getServerSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
	},
	component: Checkout,
});

function Checkout() {
	const queryClient = useQueryClient();
	const { items, clearCart } = useCart();
	const createOrderFn = useServerFn(createOrder);
	const [customerName, setCustomerName] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [city, setCity] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "cash_on_delivery">(
		"bank_transfer",
	);
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [completedOrder, setCompletedOrder] = useState<{ id: string; total: number } | null>(null);
	const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

	const submitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		setIsSubmitting(true);
		try {
			const result = await createOrderFn({
				data: {
					customerName,
					phone,
					address,
					city,
					postalCode,
					paymentMethod,
					items: items.map(({ productId, size, quantity }) => ({ productId, size, quantity })),
				},
			});
			setCompletedOrder(result);
			clearCart();
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["storefront", "products"] }),
				queryClient.invalidateQueries({ queryKey: ["storefront", "product"] }),
			]);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Pesanan gagal dibuat. Silakan coba lagi.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (completedOrder) {
		return (
			<main className="mx-auto max-w-3xl px-4 py-16 text-center">
				<div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-800">
					✓
				</div>
				<p className="mb-2 mt-5 text-xs font-bold uppercase tracking-[0.2em] text-amber-800">
					Terima kasih
				</p>
				<h1 className="m-0 font-serif text-4xl text-stone-950">Pesanan berhasil dibuat</h1>
				<p className="mb-0 mt-3 text-stone-600">
					Nomor pesanan <strong>{completedOrder.id.slice(0, 8).toUpperCase()}</strong> dengan total{" "}
					<strong>{formatRupiah(completedOrder.total)}</strong> sedang menunggu konfirmasi admin.
				</p>
				<p className="mb-0 mt-2 text-sm text-stone-500">
					Pesanan tersimpan di memori aplikasi. Pembayaran belum diproses otomatis.
				</p>
				<Link
					to="/products"
					className="mt-7 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-bold text-white no-underline"
				>
					Kembali ke katalog
				</Link>
			</main>
		);
	}

	if (items.length === 0) {
		return (
			<main className="mx-auto max-w-3xl px-4 py-16 text-center">
				<h1 className="font-serif text-3xl text-stone-900">Keranjang kosong</h1>
				<Link to="/products" className="text-amber-800 underline">
					Jelajahi katalog produk
				</Link>
			</main>
		);
	}

	return (
		<main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
			<p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-800">
				Satu langkah lagi
			</p>
			<h1 className="m-0 font-serif text-4xl text-stone-950">Checkout</h1>
			<p className="mb-8 mt-2 text-sm text-stone-600">
				Lengkapi alamat pengiriman dan metode pembayaran.
			</p>

			<div className="grid items-start gap-8 lg:grid-cols-[1fr_0.75fr]">
				<form
					onSubmit={(event) => void submitOrder(event)}
					className="space-y-5 rounded-3xl border border-stone-200 bg-white p-5 sm:p-7"
				>
					{error && (
						<div
							role="alert"
							className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
						>
							{error}
						</div>
					)}
					<div className="grid gap-4 sm:grid-cols-2">
						<FormField
							label="Nama penerima"
							value={customerName}
							onChange={setCustomerName}
							required
						/>
						<FormField
							label="Nomor telepon"
							value={phone}
							onChange={setPhone}
							required
							type="tel"
						/>
					</div>
					<label className="block space-y-2 text-sm font-semibold text-stone-800">
						Alamat lengkap
						<textarea
							required
							minLength={10}
							value={address}
							onChange={(event) => setAddress(event.target.value)}
							rows={3}
							className="w-full rounded-xl border border-stone-200 px-3 py-3 font-normal outline-none focus:border-amber-600"
							placeholder="Nama jalan, nomor rumah, RT/RW, kecamatan"
						/>
					</label>
					<div className="grid gap-4 sm:grid-cols-2">
						<FormField label="Kota / Kabupaten" value={city} onChange={setCity} required />
						<FormField label="Kode pos" value={postalCode} onChange={setPostalCode} required />
					</div>
					<fieldset className="space-y-3">
						<legend className="mb-2 text-sm font-bold text-stone-900">Metode pembayaran</legend>
						<PaymentChoice
							value="bank_transfer"
							selected={paymentMethod}
							onChange={setPaymentMethod}
							title="Transfer bank manual"
							detail="Admin akan mengirim instruksi pembayaran setelah pesanan dikonfirmasi."
						/>
						<PaymentChoice
							value="cash_on_delivery"
							selected={paymentMethod}
							onChange={setPaymentMethod}
							title="Bayar saat barang diterima"
							detail="Pilihan ini dicatat di pesanan; konfirmasi ketersediaan oleh admin."
						/>
					</fieldset>
					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full rounded-full bg-amber-700 px-5 py-3.5 text-sm font-bold text-white hover:bg-amber-800 disabled:cursor-wait disabled:opacity-60"
					>
						{isSubmitting ? "Membuat pesanan..." : `Buat pesanan · ${formatRupiah(subtotal)}`}
					</button>
				</form>

				<aside className="rounded-3xl bg-stone-950 p-5 text-white sm:p-7">
					<h2 className="m-0 font-serif text-2xl">Ringkasan pesanan</h2>
					<ul className="my-5 list-none space-y-4 border-y border-white/15 py-5 pl-0">
						{items.map((item) => (
							<li
								key={`${item.productId}-${item.size}`}
								className="flex justify-between gap-3 text-sm"
							>
								<span className="text-stone-300">
									{item.name}{" "}
									<span className="text-stone-500">
										· {item.size} × {item.quantity}
									</span>
								</span>
								<strong className="shrink-0">{formatRupiah(item.price * item.quantity)}</strong>
							</li>
						))}
					</ul>
					<div className="flex justify-between text-lg font-bold">
						<span>Total produk</span>
						<span>{formatRupiah(subtotal)}</span>
					</div>
					<p className="mb-0 mt-3 text-xs leading-5 text-stone-400">
						Ongkos kirim akan dikonfirmasi admin. Pembayaran tidak diproses di aplikasi.
					</p>
				</aside>
			</div>
		</main>
	);
}

function FormField({
	label,
	value,
	onChange,
	required = false,
	type = "text",
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	required?: boolean;
	type?: string;
}) {
	return (
		<label className="block space-y-2 text-sm font-semibold text-stone-800">
			{label}
			<input
				type={type}
				required={required}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="w-full rounded-xl border border-stone-200 px-3 py-3 font-normal outline-none focus:border-amber-600"
			/>
		</label>
	);
}

function PaymentChoice({
	value,
	selected,
	onChange,
	title,
	detail,
}: {
	value: "bank_transfer" | "cash_on_delivery";
	selected: "bank_transfer" | "cash_on_delivery";
	onChange: (value: "bank_transfer" | "cash_on_delivery") => void;
	title: string;
	detail: string;
}) {
	return (
		<label className="flex cursor-pointer gap-3 rounded-xl border border-stone-200 p-3">
			<input
				type="radio"
				name="paymentMethod"
				value={value}
				checked={selected === value}
				onChange={() => onChange(value)}
				className="mt-1 accent-amber-700"
			/>
			<span>
				<span className="block text-sm font-bold text-stone-900">{title}</span>
				<span className="mt-1 block text-xs leading-5 text-stone-600">{detail}</span>
			</span>
		</label>
	);
}
