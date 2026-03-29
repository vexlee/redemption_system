"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
    Gift,
    CheckCircle,
    AlertCircle,
    Mail,
    Phone,
    Loader2,
    ArrowLeft,
    Sparkles,
    Instagram,
    User,
} from "lucide-react";
import Link from "next/link";

interface InstagramConfig {
    mokin: { url: string; label: string };
    gajeto: { url: string; label: string };
}

const DEFAULT_IG: InstagramConfig = {
    mokin: {
        url: "https://www.instagram.com/aukey.malaysia?igsh=eDY5ZWZ1M2ZhcHV5",
        label: "Mokin Malaysia",
    },
    gajeto: {
        url: "https://www.instagram.com/gajetomalaysia?igsh=MWVyYm9ldWppbm5raA==",
        label: "Gajeto Malaysia",
    },
};

/* SVG wave separator between cream header and green body */
function WaveSeparator() {
    return (
        <div className="redeem-wave">
            <svg viewBox="0 0 400 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M0,0 L400,0 L400,10 C350,35 280,40 200,30 C120,20 50,35 0,28 Z"
                    fill="#FDF6EC"
                />
            </svg>
        </div>
    );
}

function RedeemForm() {
    const searchParams = useSearchParams();
    const storeId = searchParams.get("store_id");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [storeName, setStoreName] = useState<string | null>(null);
    const [mokinClicked, setMokinClicked] = useState(false);
    const [gajetoClicked, setGajetoClicked] = useState(false);

    // Duplicate detection
    const [duplicateWarning, setDuplicateWarning] = useState(false);
    const [checkingDuplicate, setCheckingDuplicate] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Instagram config (dynamic from admin settings)
    const [igConfig, setIgConfig] = useState<InstagramConfig>(DEFAULT_IG);

    const [storeNameLoading, setStoreNameLoading] = useState(true);

    // Fetch store name + Instagram config on mount
    useEffect(() => {
        fetch("/api/config")
            .then((r) => r.json())
            .then((data) => setIgConfig(data))
            .catch(() => { });

        if (storeId) {
            supabase
                .from("stores")
                .select("name")
                .eq("id", storeId)
                .single()
                .then(({ data, error }) => {
                    if (data && !error) setStoreName(data.name);
                    setStoreNameLoading(false);
                });
        } else {
            setStoreNameLoading(false);
        }
    }, [storeId]);

    // Check for duplicate when both email and phone are filled (debounced)
    const triggerDuplicateCheck = (emailVal: string, phoneVal: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setDuplicateWarning(false);

        const trimmedEmail = emailVal.trim().toLowerCase();
        const trimmedPhone = phoneVal.trim();
        if (!trimmedEmail || !trimmedPhone) return;

        // Basic email format check before firing the network call
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return;

        debounceRef.current = setTimeout(async () => {
            setCheckingDuplicate(true);
            try {
                const res = await fetch(
                    `/api/check-duplicate?email=${encodeURIComponent(trimmedEmail)}&phone=${encodeURIComponent(trimmedPhone)}`
                );
                const data = await res.json();
                setDuplicateWarning(!!data.duplicate);
            } catch {
                // fail silently — DB will enforce on submit
            } finally {
                setCheckingDuplicate(false);
            }
        }, 600);
    };

    const handleEmailBlur = () => triggerDuplicateCheck(email, phone);
    const handlePhoneBlur = () => triggerDuplicateCheck(email, phone);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!storeId) {
            setError("Invalid store link. Please scan a valid QR code.");
            return;
        }

        if (!name.trim() || !email.trim() || !phone.trim()) {
            setError("Name, email, and phone number are required.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);

        const res = await fetch("/api/redeem", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                store_id: storeId,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
            }),
        });

        setLoading(false);

        if (!res.ok) {
            const data = await res.json();
            setError(data.error || "Something went wrong. Please try again.");
            return;
        }

        setSuccess(true);
    };

    /* ── Invalid Store ID ── */
    if (!storeId) {
        return (
            <div className="redeem-page">
                <div className="redeem-error-card animate-scale-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "1rem", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <AlertCircle style={{ width: "1.75rem", height: "1.75rem", color: "#EF4444" }} />
                    </div>
                    <h2>Invalid Link</h2>
                    <p>
                        This redemption link is missing a store ID. Please scan a valid QR
                        code to redeem your offer.
                    </p>
                    <Link
                        href="/"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#0FA89C", fontSize: "0.875rem", fontWeight: 500, marginTop: "0.5rem", textDecoration: "none" }}
                    >
                        <ArrowLeft style={{ width: "1rem", height: "1rem" }} />
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    /* ── Success Screen ── */
    if (success) {
        return (
            <div className="redeem-page">
                <div className="redeem-card animate-scale-in">
                    <div className="redeem-header" style={{ paddingBottom: "2rem" }}>
                        <div className="redeem-success-ring" style={{ marginBottom: "1.25rem" }}>
                            <div className="ping" />
                            <div className="icon-wrap">
                                <CheckCircle style={{ width: "2.25rem", height: "2.25rem", color: "#10B981" }} />
                            </div>
                        </div>
                        <h1 style={{ fontSize: "1.375rem" }}>Thank You, {name || "there"}!</h1>
                        <p className="subtitle" style={{ marginTop: "0.75rem", lineHeight: 1.6 }}>
                            Your redemption has been successfully recorded. Enjoy your reward!
                        </p>
                        <div style={{ marginTop: "1.25rem", background: "rgba(22,210,196,0.1)", borderRadius: "0.75rem", padding: "0.875rem 1.25rem", display: "inline-block" }}>
                            <p style={{ fontSize: "0.75rem", color: "#5C5C5C", marginBottom: "0.25rem" }}>Registered Email</p>
                            <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#1A1A1A" }}>{email}</p>
                        </div>
                        <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", color: "#0FA89C" }}>
                            <Sparkles style={{ width: "1rem", height: "1rem" }} />
                            <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Redemption confirmed</span>
                            <Sparkles style={{ width: "1rem", height: "1rem" }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Main Form ── */
    return (
        <div className="redeem-page">
            <div className="redeem-card animate-fade-in-up">
                {/* Cream Header */}
                <div className="redeem-header">
                    <img
                        src="/icon.png"
                        alt="Mokin x Gajeto"
                        style={{ width: "auto", height: "7.5rem", objectFit: "contain", marginBottom: "1.25rem", display: "block", marginLeft: "auto", marginRight: "auto" }}
                    />
                    <h1>Redeem Your Offer</h1>
                    {storeName ? (
                        <p className="store-name">at {storeName}</p>
                    ) : storeNameLoading ? (
                        <div style={{ height: "1.5rem", width: "10rem", margin: "0.5rem auto 0", borderRadius: "0.5rem", background: "rgba(22,210,196,0.1)" }} className="shimmer" />
                    ) : (
                        <div style={{ height: "1.5rem" }} />
                    )}
                    <p className="subtitle">
                        Enter your details below to claim your exclusive reward.
                    </p>
                </div>

                {/* Organic wave transition */}
                <WaveSeparator />

                {/* Green Body */}
                <div className="redeem-body">
                    <form onSubmit={handleSubmit}>
                        {/* Name */}
                        <div className="redeem-input-group">
                            <label htmlFor="name">Full Name</label>
                            <div className="redeem-input-wrap">
                                <User className="redeem-icon" />
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="redeem-input"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="redeem-input-group">
                            <label htmlFor="email">Email Address</label>
                            <div className="redeem-input-wrap">
                                <Mail className="redeem-icon" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="johndoe@xyz.com"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setDuplicateWarning(false); }}
                                    onBlur={handleEmailBlur}
                                    className="redeem-input"
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="redeem-input-group">
                            <label htmlFor="phone">Phone Number</label>
                            <div className="redeem-input-wrap">
                                <Phone className="redeem-icon" />
                                <input
                                    id="phone"
                                    type="tel"
                                    placeholder="+(60)123456789"
                                    value={phone}
                                    onChange={(e) => { setPhone(e.target.value); setDuplicateWarning(false); }}
                                    onBlur={handlePhoneBlur}
                                    className="redeem-input"
                                    required
                                />
                            </div>
                        </div>

                        {/* Duplicate warning */}
                        {checkingDuplicate && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "rgba(253,246,236,0.5)", marginBottom: "0.75rem" }}>
                                <Loader2 style={{ width: "0.875rem", height: "0.875rem", animation: "spin 1s linear infinite" }} />
                                Checking availability...
                            </div>
                        )}
                        {duplicateWarning && !checkingDuplicate && (
                            <div className="redeem-alert-warn animate-scale-in">
                                <AlertCircle style={{ width: "1rem", height: "1rem", color: "#F59E0B", flexShrink: 0, marginTop: "0.125rem" }} />
                                <p style={{ fontSize: "0.8125rem", color: "#fb2724ff", lineHeight: 1.5 }}>
                                    This email and phone number have already been used to redeem an offer. Each combination can only be used once.
                                </p>
                            </div>
                        )}

                        {/* Instagram Follows */}
                        <div className="redeem-ig-section" style={{ marginBottom: "0.25rem" }}>
                            <label>Follow Us on Instagram</label>
                            <div className="redeem-ig-grid">
                                <a
                                    href={igConfig.mokin.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setMokinClicked(true)}
                                    className={`redeem-ig-btn ${mokinClicked ? "followed" : ""}`}
                                >
                                    <Instagram className="ig-icon" style={{ color: mokinClicked ? "#10B981" : "#FFFFFF" }} />
                                    <span className="ig-label" style={{ color: mokinClicked ? "#10B981" : "#FFFFFF" }}>
                                        {igConfig.mokin.label}
                                    </span>
                                </a>
                                <a
                                    href={igConfig.gajeto.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setGajetoClicked(true)}
                                    className={`redeem-ig-btn ${gajetoClicked ? "followed" : ""}`}
                                >
                                    <Instagram className="ig-icon" style={{ color: gajetoClicked ? "#10B981" : "#FFFFFF" }} />
                                    <span className="ig-label" style={{ color: gajetoClicked ? "#10B981" : "#FFFFFF" }}>
                                        {igConfig.gajeto.label}
                                    </span>
                                </a>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="redeem-alert-error animate-scale-in">
                                <AlertCircle style={{ width: "1.125rem", height: "1.125rem", color: "#EF4444", flexShrink: 0, marginTop: "0.125rem" }} />
                                <p style={{ fontSize: "0.8125rem", color: "#FCA5A5", lineHeight: 1.5 }}>{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !name.trim() || !email.trim() || !phone.trim() || !mokinClicked || !gajetoClicked}
                            className="redeem-submit"
                        >
                            {loading ? (
                                <>
                                    <Loader2 style={{ width: "1.25rem", height: "1.25rem", animation: "spin 1s linear infinite" }} />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Gift style={{ width: "1.25rem", height: "1.25rem" }} />
                                    {(!name.trim() || !email.trim() || !phone.trim() || !mokinClicked || !gajetoClicked)
                                        ? "Complete Steps to Claim"
                                        : "Claim Reward"
                                    }
                                </>
                            )}
                        </button>
<br></br>
<hr></hr>
                        {/* Privacy disclaimer */}
                        <p style={{ fontSize: "0.75rem", color: "rgba(13, 11, 11, 0.45)", textAlign: "center", marginTop: "0.75rem", lineHeight: 1.5 }}>
                            By claiming, you consent to your personal data (name, email, phone) being collected and retained solely by Unipro Global Sdn Bhd for redemption verification purposes.<br></br>Each email and phone number can only be used once.
                        </p>
                    </form>

                </div>
            </div>
        </div>
    );
}

export default function RedeemPage() {
    return (
        <Suspense
            fallback={
                <div className="redeem-page">
                    <Loader2 style={{ width: "2rem", height: "2rem", color: "#FDF6EC", animation: "spin 1s linear infinite" }} />
                </div>
            }
        >
            <RedeemForm />
        </Suspense>
    );
}
