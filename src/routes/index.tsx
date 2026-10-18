import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
	ArrowUpRight,
	BadgeDollarSign,
	Check,
	DatabaseBackup,
	LogOut,
	Package,
	Pencil,
	Plus,
	RefreshCw,
	Search,
	Trash2,
	TriangleAlert,
	X,
} from "lucide-react";
import { useState } from "react";

import { ProductArtwork } from "@/components/storefront/product-artwork";
import { authClient } from "@/lib/auth-client";
import type { Product, ProductCategory } from "@/lib/db";
import { PRODUCT_CATEGORIES } from "@/lib/db";
import { getServerSession } from "@/lib/server/auth";
import { getAdminOrders } from "@/lib/server/orders";
import {
	createProduct,
	deleteProduct,
	getProducts,
	productSchema,
	seedProductCatalog,
	updateProduct,
} from "@/lib/server/products";
import { getDashboardUserSummary } from "@/lib/server/users";
import { formatPieces, formatRupiah } from "@/lib/utils";

export const Route = createFileRoute("/")({
	beforeLoad: async () => {
		const { session } = await getServerSession();
		if (!session) {
			return redirect({ to: "/demo/better-auth" }) as any;
		}
		const { canManageUsers } = await getDashboardUserSummary();
		if (!canManageUsers) {
			return redirect({ to: "/" }) as any;
		}
	},
	component: Dashboard,
});

type InventoryFilter = "all" | "low-stock";

function Dashboard() {
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>("all");
	const [productFormOpen, setProductFormOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const productsQuery = useQuery({
		queryKey: ["products"],
		queryFn: async () => getProducts(),
	});
	const ordersQuery = useQuery({
		queryKey: ["admin", "orders"],
		queryFn: () => getAdminOrders(),
	});
	const seedCatalogFn = useServerFn(seedProductCatalog);
	const deleteProductFn = useServerFn(deleteProduct);
	const [seedMessage, setSeedMessage] = useState("");
	const products = productsQuery.data ?? [];
	const orders = ordersQuery.data ?? [];
	const lowStockProducts = products.filter((product) => product.stock < 5);
	const totalSales = orders
		.filter((order) => order.status !== "cancelled")
		.reduce((total, order) => total + order.total, 0);
	const filteredProducts = products.filter((product) => {
		const matchesSearch = `${product.name} ${product.description}`
			.toLowerCase()
			.includes(search.trim().toLowerCase());
		return matchesSearch && (inventoryFilter === "all" || product.stock < 5);
	});
	const refreshDashboard = async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["products"] }),
			queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
		]);
	};

	const handleSeedCatalog = async () => {
		try {
			const result = await seedCatalogFn();
			setSeedMessage(`${result.added} produk baru ditambahkan ke katalog.`);
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["products"] }),
				queryClient.invalidateQueries({ queryKey: ["storefront", "products"] }),
				queryClient.invalidateQueries({ queryKey: ["storefront", "product"] }),
			]);
		} catch (error) {
			setSeedMessage(error instanceof Error ? error.message : "Katalog gagal diisi.");
		}
	};

	const handleDeleteProduct = async (product: Product) => {
		if (!window.confirm(`Hapus ${product.name} dari katalog?`)) return;
		try {
			await deleteProductFn({ data: { id: product.id } });
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["products"] }),
				queryClient.invalidateQueries({ queryKey: ["storefront", "products"] }),
			]);
		} catch (error) {
			window.alert(error instanceof Error ? error.message : "Produk gagal dihapus.");
		}
	};

	const handleSignOut = async () => {
		try {
			const result = await authClient.signOut();
			if (result.error) {
				window.alert(result.error.message || "Gagal keluar dari akun.");
				return;
			}
			window.location.assign("/");
		} catch (error) {
			window.alert(error instanceof Error ? error.message : "Gagal keluar dari akun.");
		}
	};

	const handleProductSaved = async () => {
		setProductFormOpen(false);
		setEditingProduct(null);
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["products"] }),
			queryClient.invalidateQueries({ queryKey: ["storefront", "products"] }),
			queryClient.invalidateQueries({ queryKey: ["storefront", "product"] }),
		]);
	};

	return (
		<main className="admin-dashboard min-h-screen bg-gray-50 px-4 py-8 text-gray-900 sm:py-10">
			<div className="mx-auto max-w-7xl">
				<header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
					<div>
						<p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
							Ruang kerja
						</p>
						<h1 className="mb-1 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
							Dashboard Admin - Kain &amp; Kebaya
						</h1>
						<p className="m-0 text-sm text-gray-600 sm:text-base">
							Pantau katalog busana, nilai persediaan, pesanan, dan stok dalam satu tempat.
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => void refreshDashboard()}
							disabled={productsQuery.isFetching || ordersQuery.isFetching}
							className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60"
						>
							<RefreshCw
								size={16}
								aria-hidden="true"
								className={productsQuery.isFetching ? "animate-spin" : ""}
							/>
							Segarkan
						</button>
						<button
							type="button"
							onClick={() => void handleSignOut()}
							className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
						>
							<LogOut size={16} aria-hidden="true" />
							Log Keluar
						</button>
					</div>
				</header>

				<div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<StatCard
						title="Jumlah produk"
						value={
							productsQuery.isPending || productsQuery.isError
								? "—"
								: `${formatPieces(products.length)} produk`
						}
						detail="Produk tersedia dalam katalog"
						icon={Package}
						tone="accent"
					/>
					<StatCard
						title="Stok menipis"
						value={productsQuery.isPending || productsQuery.isError ? "—" : lowStockProducts.length}
						detail="Produk dengan stok kurang dari 5 unit"
						icon={TriangleAlert}
						tone="warning"
					/>
					<StatCard
						title="Pesanan masuk"
						value={ordersQuery.isPending || ordersQuery.isError ? "—" : formatPieces(orders.length)}
						detail="Seluruh pesanan yang tercatat"
						icon={Package}
						tone="positive"
					/>
					<StatCard
						title="Total penjualan"
						value={ordersQuery.isPending || ordersQuery.isError ? "—" : formatRupiah(totalSales)}
						detail="Nilai pesanan selain yang dibatalkan"
						icon={BadgeDollarSign}
						tone="accent"
					/>
				</div>

				<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(250px,0.8fr)]">
					<section
						aria-labelledby="inventory-heading"
						className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
					>
						<div className="mb-5 flex flex-wrap items-start justify-between gap-3">
							<div>
								<h2 id="inventory-heading" className="m-0 text-lg font-bold text-gray-900">
									Manajemen produk
								</h2>
								<p className="mb-0 mt-1 text-sm text-gray-600">
									{productsQuery.isPending
										? "Memuat katalog..."
										: `${filteredProducts.length} dari ${products.length} produk`}
								</p>
							</div>
							<div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
								<InventoryFilterButton
									active={inventoryFilter === "all"}
									onClick={() => setInventoryFilter("all")}
								>
									Semua
								</InventoryFilterButton>
								<InventoryFilterButton
									active={inventoryFilter === "low-stock"}
									onClick={() => setInventoryFilter("low-stock")}
								>
									Stok menipis
								</InventoryFilterButton>
							</div>
						</div>

						<label className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-[var(--sea-ink-soft)] focus-within:border-[var(--lagoon-deep)]">
							<Search size={17} aria-hidden="true" />
							<span className="sr-only">Cari produk</span>
							<input
								type="search"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								placeholder="Cari nama atau deskripsi produk"
								className="min-w-0 flex-1 border-0 bg-transparent text-sm text-[var(--sea-ink)] outline-none placeholder:text-[var(--sea-ink-soft)]"
							/>
						</label>

						{productsQuery.isPending ? (
							<div className="space-y-3" aria-label="Memuat produk">
								<div className="h-16 animate-pulse rounded-xl bg-[var(--surface)]" />
								<div className="h-16 animate-pulse rounded-xl bg-[var(--surface)]" />
							</div>
						) : productsQuery.isError ? (
							<div className="rounded-xl border border-[var(--dashboard-danger-soft)] bg-[var(--dashboard-danger-soft)] p-4 text-sm text-[var(--dashboard-danger)]">
								<p className="m-0 font-semibold">Produk gagal dimuat.</p>
								<p className="mb-0 mt-1">{productsQuery.error.message}</p>
							</div>
						) : filteredProducts.length > 0 ? (
							<div className="overflow-x-auto">
								<table className="w-full min-w-[48rem] border-collapse text-left text-sm">
									<thead>
										<tr className="border-b border-gray-200 text-xs text-gray-500">
											<th className="px-3 py-3 font-semibold">Gambar &amp; Produk</th>
											<th className="px-3 py-3 font-semibold">Kategori</th>
											<th className="px-3 py-3 font-semibold">Harga</th>
											<th className="px-3 py-3 font-semibold">Baki stok</th>
											<th className="px-3 py-3 text-right font-semibold">Tindakan</th>
										</tr>
									</thead>
									<tbody>
										{filteredProducts.map((product) => (
											<ProductRow
												key={product.id}
												product={product}
												onEdit={() => {
													setEditingProduct(product);
													setProductFormOpen(true);
												}}
												onDelete={() => void handleDeleteProduct(product)}
											/>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<div className="rounded-xl border border-dashed border-[var(--line)] px-4 py-8 text-center">
								<Package
									size={24}
									aria-hidden="true"
									className="mx-auto mb-2 text-[var(--sea-ink-soft)]"
								/>
								<p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">
									{products.length === 0
										? "Belum ada produk dalam katalog."
										: "Produk tidak ditemukan."}
								</p>
								<p className="mb-0 mt-1 text-sm text-[var(--sea-ink-soft)]">
									Coba kata kunci atau filter yang berbeda.
								</p>
							</div>
						)}
					</section>

					<aside className="space-y-5">
						<section
							aria-labelledby="quick-actions-heading"
							className="rounded-2xl border border-[var(--line)] bg-[var(--chip-bg)] p-5 sm:p-6"
						>
							<h2
								id="quick-actions-heading"
								className="mb-4 mt-0 text-lg font-bold text-[var(--sea-ink)]"
							>
								Akses cepat
							</h2>
							<div className="space-y-2">
								<QuickAction
									to="/products"
									label="Lihat katalog"
									description="Pratinjau koleksi untuk pelanggan"
									icon={Package}
								/>
								<button
									type="button"
									onClick={() => {
										setEditingProduct(null);
										setProductFormOpen(true);
									}}
									className="flex w-full items-center gap-3 rounded-xl bg-blue-700 p-3 text-left text-white transition hover:bg-blue-800"
								>
									<span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15">
										<Plus size={17} aria-hidden="true" />
									</span>
									<span>
										<span className="block text-sm font-bold">Tambah Produk Baru</span>
										<span className="mt-0.5 block text-xs text-blue-100">
											Buka borang tambah produk
										</span>
									</span>
								</button>
								<button
									type="button"
									onClick={() => void handleSeedCatalog()}
									className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
								>
									<span className="dashboard-icon dashboard-icon-accent">
										<DatabaseBackup size={17} aria-hidden="true" />
									</span>
									<span>
										<span className="block text-sm font-bold text-gray-900">
											Isi Katalog Awal (Seed Data)
										</span>
										<span className="mt-0.5 block text-xs text-gray-600">
											Tambahkan produk contoh ke katalog
										</span>
									</span>
								</button>
							</div>
							{seedMessage && (
								<output className="mb-0 mt-3 block text-xs text-[var(--sea-ink-soft)]">
									{seedMessage}
								</output>
							)}
						</section>

						<section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
							<h2 className="mb-4 mt-0 text-lg font-bold text-[var(--sea-ink)]">Pesanan terbaru</h2>
							{ordersQuery.isPending ? (
								<p className="m-0 text-sm text-[var(--sea-ink-soft)]">Memuat pesanan...</p>
							) : ordersQuery.isError ? (
								<p role="alert" className="m-0 text-sm text-[var(--dashboard-danger)]">
									Pesanan gagal dimuat: {ordersQuery.error.message}
								</p>
							) : ordersQuery.data.length === 0 ? (
								<p className="m-0 text-sm text-[var(--sea-ink-soft)]">Belum ada pesanan masuk.</p>
							) : (
								<ul className="m-0 list-none space-y-3 p-0">
									{ordersQuery.data.slice(0, 4).map((order) => (
										<li
											key={order.id}
											className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3 last:border-0 last:pb-0"
										>
											<span className="min-w-0">
												<strong className="block truncate text-sm text-[var(--sea-ink)]">
													{order.customerName}
												</strong>
												<span className="text-xs text-[var(--sea-ink-soft)]">
													{order.items.length} produk · {order.status}
												</span>
											</span>
											<strong className="shrink-0 text-sm text-[var(--sea-ink)]">
												{formatRupiah(order.total)}
											</strong>
										</li>
									))}
								</ul>
							)}
						</section>

						<section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
							<div className="mb-3 flex items-center gap-2 text-[var(--dashboard-warning)]">
								<TriangleAlert size={18} aria-hidden="true" />
								<h2 className="m-0 text-sm font-bold">Perhatian stok</h2>
							</div>
							<p className="mb-4 mt-0 text-sm text-[var(--sea-ink-soft)]">
								{productsQuery.isPending
									? "Memeriksa stok produk..."
									: lowStockProducts.length === 0
										? "Semua produk memiliki persediaan yang cukup."
										: `${lowStockProducts.length} produk memiliki stok kurang dari 5 unit.`}
							</p>
							<button
								type="button"
								onClick={() => {
									setSearch("");
									setInventoryFilter("low-stock");
								}}
								disabled={productsQuery.isPending || lowStockProducts.length === 0}
								className="text-sm font-bold text-[var(--dashboard-warning)] underline underline-offset-4 hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
							>
								Lihat stok menipis
								<span className="sr-only"> di inventaris</span>
							</button>
						</section>
					</aside>
				</div>
				{productFormOpen && (
					<ProductFormDialog
						key={editingProduct?.id ?? "new"}
						product={editingProduct}
						onClose={() => {
							setProductFormOpen(false);
							setEditingProduct(null);
						}}
						onSaved={() => handleProductSaved()}
					/>
				)}
			</div>
		</main>
	);
}

function StatCard({
	title,
	value,
	detail,
	icon: Icon,
	tone,
}: {
	title: string;
	value: number | string;
	detail: string;
	icon: typeof Package;
	tone: "accent" | "positive" | "warning";
}) {
	return (
		<div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
			<div className="mb-4 flex items-center justify-between gap-3">
				<p className="m-0 text-sm font-semibold text-gray-600">{title}</p>
				<span className={`dashboard-icon dashboard-icon-${tone}`}>
					<Icon size={18} aria-hidden="true" />
				</span>
			</div>
			<p className="m-0 break-words text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
				{value}
			</p>
			<p className="mb-0 mt-1 text-xs text-gray-600">{detail}</p>
		</div>
	);
}

function ProductFormDialog({
	product,
	onClose,
	onSaved,
}: {
	product: Product | null;
	onClose: () => void;
	onSaved: () => Promise<void>;
}) {
	const createFn = useServerFn(createProduct);
	const updateFn = useServerFn(updateProduct);
	const [name, setName] = useState(product?.name ?? "");
	const [category, setCategory] = useState<ProductCategory>(product?.category ?? "Kebaya Modern");
	const [price, setPrice] = useState(product ? String(product.price) : "");
	const [stock, setStock] = useState(product ? String(product.stock) : "");
	const [description, setDescription] = useState(product?.description ?? "");
	const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
	const [error, setError] = useState("");
	const [isSaving, setIsSaving] = useState(false);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		const parsed = productSchema.safeParse({
			name,
			category,
			price,
			stock,
			description,
			sizes: product?.sizes ?? ["S", "M", "L", "XL"],
			careInstructions: product?.careInstructions ?? "Cuci tangan dengan deterjen lembut.",
			imageUrl: imageUrl.trim(),
		});
		if (!parsed.success) {
			setError(parsed.error.issues.map((issue) => issue.message).join(" "));
			return;
		}

		setIsSaving(true);
		try {
			if (product) {
				await updateFn({ data: { id: product.id, ...parsed.data } });
			} else {
				await createFn({ data: parsed.data });
			}
			await onSaved();
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Produk gagal disimpan.");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<dialog
			open
			aria-labelledby="product-form-heading"
			aria-modal="true"
			onClick={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
			onKeyDown={(event) => {
				if (event.key === "Escape") onClose();
			}}
			className="fixed inset-0 z-[110] m-0 grid h-full w-full max-w-none place-items-center overflow-y-auto border-0 bg-gray-950/50 p-4"
		>
			<section className="my-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:p-7">
				<div className="mb-6 flex items-start justify-between gap-4">
					<div>
						<p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
							Katalog produk
						</p>
						<h2 id="product-form-heading" className="m-0 text-xl font-bold text-gray-900">
							{product ? "Edit produk" : "Tambah produk baru"}
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						disabled={isSaving}
						aria-label="Tutup borang"
						className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
					>
						<X size={18} aria-hidden="true" />
					</button>
				</div>

				<form onSubmit={(event) => void handleSubmit(event)} className="grid gap-4 sm:grid-cols-2">
					<label className="grid gap-1.5 text-sm font-semibold text-gray-700 sm:col-span-2">
						Nama produk
						<input
							value={name}
							onChange={(event) => setName(event.target.value)}
							required
							minLength={2}
							className="h-11 rounded-lg border border-gray-300 bg-gray-50 px-3 font-normal text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
							placeholder="Contoh: Kebaya Modern Kartini"
						/>
					</label>

					<label className="grid gap-1.5 text-sm font-semibold text-gray-700">
						Kategori
						<select
							value={category}
							onChange={(event) => {
								const selected = PRODUCT_CATEGORIES.find((item) => item === event.target.value);
								if (selected) setCategory(selected);
							}}
							className="h-11 rounded-lg border border-gray-300 bg-gray-50 px-3 font-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
						>
							{PRODUCT_CATEGORIES.map((item) => (
								<option key={item} value={item}>
									{item}
								</option>
							))}
						</select>
					</label>

					<label className="grid gap-1.5 text-sm font-semibold text-gray-700">
						Harga (IDR)
						<input
							type="number"
							value={price}
							onChange={(event) => setPrice(event.target.value)}
							required
							min="1"
							step="1"
							className="h-11 rounded-lg border border-gray-300 bg-gray-50 px-3 font-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
							placeholder="350000"
						/>
					</label>

					<label className="grid gap-1.5 text-sm font-semibold text-gray-700">
						Baki stok (unit)
						<input
							type="number"
							value={stock}
							onChange={(event) => setStock(event.target.value)}
							required
							min="0"
							step="1"
							className="h-11 rounded-lg border border-gray-300 bg-gray-50 px-3 font-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
							placeholder="12"
						/>
					</label>

					<label className="grid gap-1.5 text-sm font-semibold text-gray-700 sm:col-span-2">
						Deskripsi produk
						<textarea
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							required
							minLength={10}
							rows={4}
							className="resize-y rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 font-normal text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
							placeholder="Terangkan bahan, keistimewaan, dan butiran produk."
						/>
					</label>

					<label className="grid gap-1.5 text-sm font-semibold text-gray-700 sm:col-span-2">
						URL gambar (opsional)
						<input
							type="url"
							value={imageUrl}
							onChange={(event) => setImageUrl(event.target.value)}
							className="h-11 rounded-lg border border-gray-300 bg-gray-50 px-3 font-normal text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
							placeholder="https://..."
						/>
					</label>

					{error && (
						<p
							role="alert"
							className="m-0 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2"
						>
							{error}
						</p>
					)}

					<div className="flex justify-end gap-2 pt-2 sm:col-span-2">
						<button
							type="button"
							onClick={onClose}
							disabled={isSaving}
							className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
						>
							Batal
						</button>
						<button
							type="submit"
							disabled={isSaving}
							className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
						>
							<Check size={16} aria-hidden="true" />
							{isSaving ? "Menyimpan..." : product ? "Simpan perubahan" : "Simpan produk"}
						</button>
					</div>
				</form>
			</section>
		</dialog>
	);
}

function InventoryFilterButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			aria-pressed={active}
			onClick={onClick}
			className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
				active
					? "bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent)]"
					: "text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)]"
			}`}
		>
			{children}
		</button>
	);
}

function ProductRow({
	product,
	onEdit,
	onDelete,
}: {
	product: Product;
	onEdit: () => void;
	onDelete: () => void;
}) {
	const stockTone =
		product.stock < 5
			? "rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800"
			: "rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800";

	return (
		<tr className="border-b border-gray-100 last:border-0">
			<td className="max-w-72 px-3 py-3">
				<div className="flex items-center gap-3">
					<ProductArtwork
						category={product.category}
						imageUrl={product.imageUrl}
						name={product.name}
						className="h-14 w-12 shrink-0 rounded-lg"
					/>
					<div className="min-w-0">
						<p className="m-0 truncate font-bold text-gray-900">{product.name}</p>
						<p className="mb-0 mt-1 truncate text-xs text-gray-500">{product.description}</p>
					</div>
				</div>
			</td>
			<td className="px-3 py-3 text-xs text-gray-600">{product.category}</td>
			<td className="whitespace-nowrap px-3 py-3 font-semibold text-gray-900">
				{formatRupiah(product.price)}
			</td>
			<td className="px-3 py-3">
				<span className={stockTone}>
					{product.stock === 0 ? "Habis" : `${formatPieces(product.stock)} unit`}
				</span>
			</td>
			<td className="px-3 py-3">
				<div className="flex justify-end gap-2">
					<button
						type="button"
						onClick={onEdit}
						className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-50"
					>
						<Pencil size={13} aria-hidden="true" />
						Edit
					</button>
					<button
						type="button"
						onClick={onDelete}
						aria-label={`Hapus ${product.name}`}
						className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 text-red-700 transition hover:bg-red-50"
					>
						<Trash2 size={15} aria-hidden="true" />
					</button>
				</div>
			</td>
		</tr>
	);
}

function QuickAction({
	to,
	label,
	description,
	icon: Icon,
}: {
	to: "/products" | "/products/new";
	label: string;
	description: string;
	icon: typeof Package;
}) {
	return (
		<Link
			to={to}
			className="group flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-inherit no-underline hover:border-[var(--dashboard-accent)] hover:bg-[var(--dashboard-accent-soft)]"
		>
			<span className="dashboard-icon dashboard-icon-accent">
				<Icon size={17} aria-hidden="true" />
			</span>
			<span className="min-w-0 flex-1">
				<span className="block text-sm font-bold text-[var(--sea-ink)]">{label}</span>
				<span className="mt-0.5 block text-xs text-[var(--sea-ink-soft)]">{description}</span>
			</span>
			<ArrowUpRight
				size={16}
				aria-hidden="true"
				className="shrink-0 text-[var(--sea-ink-soft)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
			/>
		</Link>
	);
}
