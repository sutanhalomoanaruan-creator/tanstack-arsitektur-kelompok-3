import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CreditCard, Sparkles, UserCheck, ShieldCheck, Clock } from "lucide-react";

import { ProductArtwork } from "@/components/storefront/product-artwork";
import { getPublicProducts } from "@/lib/server/products";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
    const productsQuery = useQuery({
        queryKey: ["storefront", "products"],
        queryFn: () => getPublicProducts(),
    });

    return (
        <main>
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-slate-950 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_25%,rgba(59,130,246,0.25),transparent_45%)]" />
                <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
                    <div>
                        <p className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-blue-400">
                            <CreditCard size={16} />
                            Sistem Absensi · Kelompok 3
                        </p>
                        <h1 className="m-0 max-w-2xl font-serif text-5xl leading-[1.08] sm:text-6xl lg:text-7xl">
                            Sistem Absensi
                            <br />
                            <span className="text-blue-400">Berbasis KTM</span>
                        </h1>
                        <p className="mb-0 mt-6 max-w-xl text-base leading-8 text-slate-300">
                            Solusi praktis dan cepat untuk pencatatan kehadiran mahasiswa menggunakan Kartu Tanda Mahasiswa (KTM). Terintegrasi dengan arsitektur TanStack modern.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                to="/products"
                                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3.5 text-sm font-bold text-white no-underline transition hover:bg-blue-500"
                            >
                                Tap Absensi KTM <ArrowRight size={17} />
                            </Link>
                            <a
                                href="#fitur"
                                className="rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white no-underline hover:bg-white/10"
                            >
                                Lihat Fitur
                            </a>
                        </div>
                    </div>
                    <div className="relative mx-auto w-full max-w-lg">
                        <div className="absolute -inset-5 rounded-[3rem] border border-blue-400/20" />
                        <ProductArtwork
                            category="KTM RFID / Barcode"
                            imageUrl=""
                            name="Kartu Tanda Mahasiswa"
                            className="min-h-[22rem] rounded-[2.5rem] sm:min-h-[29rem]"
                        />
                        <div className="absolute -bottom-5 left-4 rounded-2xl border border-white/10 bg-slate-900/90 p-4 shadow-xl backdrop-blur sm:left-[-2rem]">
                            <div className="flex items-center gap-3">
                                <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-500 text-white">
                                    <Sparkles size={19} />
                                </span>
                                <span>
                                    <strong className="block text-sm">Pencatatan Real-time</strong>
                                    <span className="text-xs text-slate-400">Akurat &amp; Efisien</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Info Banner */}
            <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
                <div className="grid gap-3 rounded-2xl bg-blue-50 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-7">
                    <div>
                        <p className="m-0 text-xs font-bold uppercase tracking-[0.18em] text-blue-800">
                            Status Presensi
                        </p>
                        <p className="mb-0 mt-1 font-serif text-xl text-slate-900">
                            Tempelkan KTM Anda pada reader untuk melakukan presensi perkuliahan.
                        </p>
                    </div>
                    <Link
                        to="/products"
                        className="inline-flex items-center gap-2 text-sm font-bold text-blue-900 no-underline"
                    >
                        Mulai Scan <ArrowRight size={16} />
                    </Link>
                </div>
            </section>

            {/* Stat Cards */}
            <section className="mx-auto grid max-w-7xl gap-3 px-4 py-5 sm:grid-cols-3 sm:px-6">
                <Stat value="100%" label="Akurasi Data Presensi" />
                <Stat value="< 1 Detik" label="Kecepatan Respon Tap" />
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-100 text-blue-900">
                        <Clock size={20} />
                    </span>
                    <span>
                        <strong className="block text-sm text-slate-900">Otomatisasi Waktu</strong>
                        <span className="text-xs text-slate-500">Mencatat jam masuk tepat waktu</span>
                    </span>
                </div>
            </section>

            {/* Features Section */}
            <section id="fitur" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
                <SectionHeading eyebrow="Keunggulan Sistem" title="Fitur Utama Absensi KTM" />
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FeatureCard
                        icon={<CreditCard className="text-blue-600" size={24} />}
                        title="Integrasi KTM Mahasiswa"
                        description="Mendukung pembacaan data identitas langsung dari chip/barcode Kartu Tanda Mahasiswa."
                    />
                    <FeatureCard
                        icon={<UserCheck className="text-blue-600" size={24} />}
                        title="Verifikasi Otomatis"
                        description="Memastikan data mahasiswa terverifikasi secara otomatis ke dalam sistem kelas."
                    />
                    <FeatureCard
                        icon={<ShieldCheck className="text-blue-600" size={24} />}
                        title="Keamanan Data"
                        description="Mencegah kecurangan titip absen dengan sistem konfirmasi ganda."
                    />
                </div>
            </section>
        </main>
    );
}

function Stat({ value, label }: { value: string; label: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <strong className="block font-serif text-3xl text-slate-950">{value}</strong>
            <span className="mt-1 block text-sm text-slate-600">{label}</span>
        </div>
    );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
    return (
        <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-800">{eyebrow}</p>
            <h2 className="m-0 font-serif text-3xl text-slate-950 sm:text-4xl">{title}</h2>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
            <div className="mb-4">{icon}</div>
            <h3 className="mb-2 font-serif text-xl font-bold">{title}</h3>
            <p className="m-0 text-sm leading-relaxed text-slate-600">{description}</p>
        </div>
    );
}