"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                router.push("/admin");
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || "Incorrect password. Please try again.");
                if (res.status === 401) setPassword("");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            {/* Background glow */}
            <div
                style={{
                    position: "fixed",
                    top: "30%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "600px",
                    height: "600px",
                    background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
                    pointerEvents: "none",
                }}
            />

            <div className="w-full max-w-md animate-fade-in-up">
                {/* Logo / Icon */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/15 border border-primary/20 mb-5 animate-float">
                        <ShieldCheck className="w-10 h-10 text-primary-light" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-text-primary tracking-tight mb-2">
                        Admin Access
                    </h1>
                    <p className="text-text-secondary text-sm">
                        Enter your password to access the dashboard
                    </p>
                </div>

                {/* Card */}
                <div className="glass-card p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Password field */}
                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-text-secondary"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Lock className="w-4 h-4 text-text-muted" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError("");
                                    }}
                                    placeholder="Enter admin password"
                                    required
                                    className="input-field pr-12"
                                    autoComplete="current-password"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded text-text-muted hover:text-text-secondary transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-error/10 border border-error/25 animate-scale-in">
                                <div className="w-1.5 h-1.5 rounded-full bg-error flex-shrink-0" />
                                <p className="text-sm text-error">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="btn-primary mt-2"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                "Sign In to Dashboard"
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-text-muted text-xs mt-6">
                    Redemption System · Admin Portal
                </p>
            </div>
        </div>
    );
}
