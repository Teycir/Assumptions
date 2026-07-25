import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import React from "react";

// --- Subtitle Component with Glass Pill Styling ---
const SubtitleOverlay: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 50,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 100,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          padding: "14px 32px",
          borderRadius: "16px",
          background: "rgba(11, 14, 20, 0.88)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 12px 35px rgba(0, 0, 0, 0.75)",
          color: "#FFFFFF",
          fontSize: "22px",
          fontWeight: 700,
          fontFamily: "'Inter', sans-serif",
          textAlign: "center",
          maxWidth: "1100px",
          lineHeight: "1.45",
          letterSpacing: "0.3px",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// --- Custom Spring Helper ---
const useSmoothSpring = (frame: number, delay: number, fps = 30) => {
  return spring({
    frame: frame - delay,
    fps,
    config: { damping: 16, mass: 0.8, stiffness: 110 },
  });
};

// --- Scene 1: Kinetic Opening Hook ---
const Scene1Hook: React.FC<{ frame: number }> = ({ frame }) => {
  const titleProgress = useSmoothSpring(frame, 10);
  const subtitleProgress = useSmoothSpring(frame, 35);
  const cardFloatProgress = useSmoothSpring(frame, 55);

  const glowOpacity = interpolate(frame, [0, 60, 265], [0.3, 0.85, 0.4]);
  const cardRotateX = interpolate(frame, [0, 265], [12, 4]);
  const cardRotateY = interpolate(frame, [0, 265], [-8, 6]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080A0F",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'JetBrains Mono', monospace",
        color: "#F0F6FC",
        overflow: "hidden",
        perspective: 1200,
      }}
    >
      {/* Background Glow & Grid */}
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(88, 166, 255, 0.22) 0%, rgba(255, 51, 102, 0.08) 45%, rgba(8, 10, 15, 0) 70%)",
          transform: `scale(${1 + Math.sin(frame / 25) * 0.05})`,
          opacity: glowOpacity,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div style={{ textAlign: "center", zIndex: 2, padding: "0 40px" }}>
        <div
          style={{
            display: "inline-block",
            padding: "8px 24px",
            borderRadius: "20px",
            background: "rgba(255, 51, 102, 0.14)",
            border: "1px solid rgba(255, 51, 102, 0.4)",
            color: "#FF3366",
            fontSize: "16px",
            fontWeight: 800,
            letterSpacing: "2px",
            marginBottom: "28px",
            transform: `translateY(${(1 - titleProgress) * 20}px)`,
            opacity: titleProgress,
          }}
        >
          ⚡ CODE REVIEW PARADIGM SHIFT
        </div>

        <h1
          style={{
            fontSize: "68px",
            fontWeight: 900,
            letterSpacing: "-1.5px",
            lineHeight: 1.15,
            margin: "0 0 20px 0",
            background: "linear-gradient(180deg, #FFFFFF 0%, #C9D1D9 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            transform: `scale(${0.92 + titleProgress * 0.08})`,
            opacity: titleProgress,
          }}
        >
          WHAT IS YOUR CODE <br />
          <span
            style={{
              color: "#58A6FF",
              WebkitTextFillColor: "#58A6FF",
              textShadow: "0 0 35px rgba(88, 166, 255, 0.5)",
            }}
          >
            SILENTLY ASSUMING?
          </span>
        </h1>

        <p
          style={{
            fontSize: "25px",
            color: "#8B949E",
            maxWidth: "900px",
            margin: "0 auto",
            transform: `translateY(${(1 - subtitleProgress) * 15}px)`,
            opacity: subtitleProgress,
          }}
        >
          Most production failures are not caused by broken syntax. <br />
          They happen because of <strong style={{ color: "#FF8800" }}>unverified assumptions</strong>.
        </p>

        {/* Floating Preview Card in 3D */}
        <div
          style={{
            marginTop: "35px",
            display: "inline-block",
            padding: "16px 28px",
            backgroundColor: "#161B22",
            border: "1px solid #30363D",
            borderRadius: "12px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
            transform: `rotateX(${cardRotateX}deg) rotateY(${cardRotateY}deg) scale(${cardFloatProgress})`,
            opacity: cardFloatProgress,
          }}
        >
          <div style={{ display: "flex", gap: "16px", alignItems: "center", fontSize: "16px" }}>
            <span style={{ color: "#FF3366", fontWeight: 800 }}>P0 RISK</span>
            <span style={{ color: "#8B949E" }}>|</span>
            <span style={{ color: "#F0F6FC", fontWeight: 600 }}>Unprotected Payment Retry</span>
            <span style={{ color: "#8B949E" }}>|</span>
            <span style={{ color: "#58A6FF" }}>checkout.ts:L8-L11</span>
          </div>
        </div>
      </div>

      <SubtitleOverlay text="What is your code silently assuming? Most production failures are not caused by broken syntax, but by unverified assumptions." />
    </AbsoluteFill>
  );
};

// --- Scene 2: Real Code Inspection (fixtures/duplicate-checkout/checkout.ts) ---
const Scene2RealCase: React.FC<{ frame: number }> = ({ frame }) => {
  const localFrame = frame - 265;
  const cardSpring = useSmoothSpring(localFrame, 5);
  const highlightProgress = useSmoothSpring(localFrame, 35);
  const warningSpring = useSmoothSpring(localFrame, 70);

  const laserPosition = interpolate(localFrame, [20, 90], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rotateX = interpolate(cardSpring, [0, 1], [14, 0]);
  const scale = interpolate(cardSpring, [0, 1], [0.88, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080A0F",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'JetBrains Mono', monospace",
        perspective: 1200,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "1200px",
          backgroundColor: "#161B22",
          borderRadius: "12px",
          border: "1px solid #30363D",
          boxShadow: "0 25px 65px rgba(0, 0, 0, 0.8)",
          transform: `rotateX(${rotateX}deg) scale(${scale})`,
          opacity: cardSpring,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Window Header */}
        <div
          style={{
            height: "46px",
            backgroundColor: "#0D1117",
            borderBottom: "1px solid #30363D",
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FF5F56" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FFBD2E" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#27C93F" }} />
            <span style={{ marginLeft: "14px", color: "#8B949E", fontSize: "14px", fontWeight: 600 }}>
              fixtures/duplicate-checkout/checkout.ts
            </span>
          </div>
          <span style={{ color: "#FF3366", fontSize: "13px", fontWeight: 800, letterSpacing: "1px" }}>
            UNPROTECTED ROUTE
          </span>
        </div>

        {/* Code Content */}
        <div style={{ padding: "32px", fontSize: "20px", lineHeight: "1.85", color: "#E6EDF3" }}>
          <div style={{ color: "#8B949E" }}>// Fixture: duplicate-checkout (Minimal checkout endpoint)</div>
          <div>
            app.<span style={{ color: "#D2A8FF" }}>post</span>(<span style={{ color: "#A5D6FF" }}>"/checkout"</span>, <span style={{ color: "#FF7B72" }}>async</span> (req, res) =&gt; &#123;
          </div>

          {/* Highlighted Lines 8-11: stripe.charges.create */}
          <div
            style={{
              paddingLeft: "32px",
              backgroundColor: highlightProgress > 0 ? "rgba(255, 51, 102, 0.16)" : "transparent",
              borderLeft: highlightProgress > 0 ? "4px solid #FF3366" : "4px solid transparent",
              transition: "background-color 0.3s, border-left 0.3s",
              margin: "6px 0",
              borderRadius: "0 6px 6px 0",
            }}
          >
            <div>
              <span style={{ color: "#FF7B72" }}>const</span> payment = <span style={{ color: "#FF7B72" }}>await</span> stripe.charges.<span style={{ color: "#D2A8FF" }}>create</span>(&#123;
            </div>
            <div style={{ paddingLeft: "32px" }}>amount: req.body.amount,</div>
            <div style={{ paddingLeft: "32px" }}>customer: req.user.stripeCustomerId,</div>
            <div>&#125;);</div>
          </div>

          <div style={{ paddingLeft: "32px" }}>
            <span style={{ color: "#FF7B72" }}>await</span> orders.<span style={{ color: "#D2A8FF" }}>create</span>(&#123; userId: req.user.id, paymentId: payment.id &#125;);
          </div>
          <div style={{ paddingLeft: "32px" }}>res.<span style={{ color: "#D2A8FF" }}>json</span>(payment);</div>
          <div>&#125;);</div>
        </div>

        {/* Laser Scan Overlay */}
        {localFrame > 15 && localFrame < 100 && (
          <div
            style={{
              position: "absolute",
              top: `${laserPosition}%`,
              left: 0,
              right: 0,
              height: "2px",
              background: "linear-gradient(90deg, transparent, #FF3366, transparent)",
              boxShadow: "0 0 15px #FF3366",
            }}
          />
        )}

        {/* Finding Alert Banner */}
        {warningSpring > 0 && (
          <div
            style={{
              margin: "0 32px 32px 32px",
              padding: "18px 24px",
              backgroundColor: "rgba(255, 51, 102, 0.12)",
              border: "1px solid #FF3366",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "20px",
              transform: `translateY(${(1 - warningSpring) * 12}px)`,
              opacity: warningSpring,
            }}
          >
            <div style={{ fontSize: "32px" }}>🚨</div>
            <div>
              <div style={{ color: "#FF3366", fontWeight: 800, fontSize: "17px", letterSpacing: "0.5px" }}>
                P0 RISK DETECTED — UNPROTECTED PAYMENT RETRY
              </div>
              <div style={{ color: "#C9D1D9", fontSize: "15px", marginTop: "4px" }}>
                <strong>Condition:</strong> Payment endpoint is idempotent across retries |{" "}
                <strong>If False:</strong> Double billing on network retry |{" "}
                <strong>Locator:</strong> checkout.ts:L8-L11
              </div>
            </div>
          </div>
        )}
      </div>

      <SubtitleOverlay text="Here is a real case from our duplicate checkout fixture. This payment endpoint calls stripe.charges.create without an idempotency key, assuming requests only arrive once." />
    </AbsoluteFill>
  );
};

// --- Scene 3: The Assumption Ledger Table ---
const Scene3LedgerTable: React.FC<{ frame: number }> = ({ frame }) => {
  const localFrame = frame - 625;
  const tableSpring = useSmoothSpring(localFrame, 5);

  const row1Spring = useSmoothSpring(localFrame, 25);
  const row2Spring = useSmoothSpring(localFrame, 55);
  const row3Spring = useSmoothSpring(localFrame, 85);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080A0F",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'JetBrains Mono', monospace",
        padding: "40px",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          width: "1400px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          transform: `translateY(${(1 - tableSpring) * 15}px)`,
          opacity: tableSpring,
        }}
      >
        <div>
          <h2 style={{ fontSize: "36px", color: "#F0F6FC", margin: 0, fontWeight: 900 }}>
            ASSUMPTION LEDGER
          </h2>
          <span style={{ color: "#8B949E", fontSize: "16px" }}>
            Evidence-backed risks extracted from Git repository fixtures
          </span>
        </div>
        <div
          style={{
            padding: "8px 20px",
            backgroundColor: "#161B22",
            border: "1px solid #30363D",
            borderRadius: "8px",
            color: "#58A6FF",
            fontSize: "15px",
            fontWeight: 700,
          }}
        >
          ⚡ /assumptions-scan
        </div>
      </div>

      {/* Ledger Table Container */}
      <div
        style={{
          width: "1400px",
          backgroundColor: "#161B22",
          borderRadius: "12px",
          border: "1px solid #30363D",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.7)",
          transform: `scale(${0.95 + tableSpring * 0.05})`,
          opacity: tableSpring,
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.8fr 2.4fr 1.6fr 1.6fr 1.6fr 1.2fr",
            padding: "16px 24px",
            backgroundColor: "#0D1117",
            borderBottom: "1px solid #30363D",
            color: "#8B949E",
            fontSize: "13px",
            fontWeight: 800,
            letterSpacing: "1px",
          }}
        >
          <div>PRIORITY</div>
          <div>ASSUMPTION CONDITION</div>
          <div>EVIDENCE LOCATOR</div>
          <div>IF FALSE (CONSEQUENCE)</div>
          <div>FALSIFICATION TEST</div>
          <div>STATUS</div>
        </div>

        {/* Row 1: duplicate-checkout (P0) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.8fr 2.4fr 1.6fr 1.6fr 1.6fr 1.2fr",
            padding: "20px 24px",
            borderBottom: "1px solid #21262D",
            alignItems: "center",
            backgroundColor: "rgba(255, 51, 102, 0.06)",
            transform: `translateX(${(1 - row1Spring) * -20}px)`,
            opacity: row1Spring,
          }}
        >
          <div>
            <span style={{ padding: "4px 10px", backgroundColor: "#FF3366", color: "#FFF", borderRadius: "4px", fontSize: "13px", fontWeight: 900 }}>
              P0
            </span>
          </div>
          <div style={{ color: "#F0F6FC", fontWeight: 600, fontSize: "15px" }}>
            Payment endpoint is idempotent across retries
          </div>
          <div style={{ color: "#58A6FF", fontSize: "14px" }}>
            checkout.ts:L8-L11
          </div>
          <div style={{ color: "#FF3366", fontSize: "14px", fontWeight: 700 }}>
            Double billing
          </div>
          <div style={{ color: "#C9D1D9", fontSize: "13px" }}>
            test_duplicate_checkout
          </div>
          <div>
            <span style={{ padding: "6px 12px", backgroundColor: "#DA3633", color: "#FFF", borderRadius: "4px", fontSize: "12px", fontWeight: 800 }}>
              UNPROTECTED
            </span>
          </div>
        </div>

        {/* Row 2: tenant-leak (P0) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.8fr 2.4fr 1.6fr 1.6fr 1.6fr 1.2fr",
            padding: "20px 24px",
            borderBottom: "1px solid #21262D",
            alignItems: "center",
            transform: `translateX(${(1 - row2Spring) * -20}px)`,
            opacity: row2Spring,
          }}
        >
          <div>
            <span style={{ padding: "4px 10px", backgroundColor: "#FF3366", color: "#FFF", borderRadius: "4px", fontSize: "13px", fontWeight: 900 }}>
              P0
            </span>
          </div>
          <div style={{ color: "#F0F6FC", fontWeight: 600, fontSize: "15px" }}>
            Invoice query is scoped to caller tenant
          </div>
          <div style={{ color: "#58A6FF", fontSize: "14px" }}>
            invoices.ts:L5-L7
          </div>
          <div style={{ color: "#D29922", fontSize: "14px", fontWeight: 700 }}>
            Cross-tenant data leak
          </div>
          <div style={{ color: "#C9D1D9", fontSize: "13px" }}>
            test_cross_tenant_read
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ padding: "4px 8px", backgroundColor: "#DA3633", color: "#FFF", borderRadius: "4px", fontSize: "11px", fontWeight: 800 }}>
              QUERY: UNPROTECTED
            </span>
            <span style={{ padding: "4px 8px", backgroundColor: "#6E7681", color: "#FFF", borderRadius: "4px", fontSize: "11px", fontWeight: 800 }}>
              SYSTEM: UNKNOWN
            </span>
          </div>
        </div>

        {/* Row 3: queue-redelivery (P1) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.8fr 2.4fr 1.6fr 1.6fr 1.6fr 1.2fr",
            padding: "20px 24px",
            alignItems: "center",
            transform: `translateX(${(1 - row3Spring) * -20}px)`,
            opacity: row3Spring,
          }}
        >
          <div>
            <span style={{ padding: "4px 10px", backgroundColor: "#D29922", color: "#FFF", borderRadius: "4px", fontSize: "13px", fontWeight: 900 }}>
              P1
            </span>
          </div>
          <div style={{ color: "#F0F6FC", fontWeight: 600, fontSize: "15px" }}>
            Redelivered event does not re-trigger side effects
          </div>
          <div style={{ color: "#58A6FF", fontSize: "14px" }}>
            worker.ts:L14-L18
          </div>
          <div style={{ color: "#D29922", fontSize: "14px", fontWeight: 700 }}>
            Duplicate email dispatch
          </div>
          <div style={{ color: "#C9D1D9", fontSize: "13px" }}>
            test_redelivery_dedup
          </div>
          <div>
            <span style={{ padding: "6px 12px", backgroundColor: "#DA3633", color: "#FFF", borderRadius: "4px", fontSize: "12px", fontWeight: 800 }}>
              UNPROTECTED
            </span>
          </div>
        </div>
      </div>

      <SubtitleOverlay text="Assumptions scans your code diff and produces an evidence-backed ledger. Every finding cites exact file and line locators, explicit P0 to P3 priorities, and marks uninspected paths as Unknown rather than guessing." />
    </AbsoluteFill>
  );
};

// --- Scene 4: Falsification Tests & Controls (--tests mode) ---
const Scene4Falsification: React.FC<{ frame: number }> = ({ frame }) => {
  const localFrame = frame - 1090;
  const termSpring = useSmoothSpring(localFrame, 5);
  const diffSpring = useSmoothSpring(localFrame, 45);
  const testPassSpring = useSmoothSpring(localFrame, 85);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080A0F",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'JetBrains Mono', monospace",
        padding: "40px",
      }}
    >
      <div
        style={{
          width: "1250px",
          backgroundColor: "#0D1117",
          borderRadius: "12px",
          border: "1px solid #30363D",
          boxShadow: "0 25px 65px rgba(0, 0, 0, 0.8)",
          transform: `scale(${0.92 + termSpring * 0.08})`,
          opacity: termSpring,
          overflow: "hidden",
        }}
      >
        {/* Terminal Header */}
        <div
          style={{
            height: "44px",
            backgroundColor: "#161B22",
            borderBottom: "1px solid #30363D",
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FF5F56" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FFBD2E" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#27C93F" }} />
            <span style={{ marginLeft: "14px", color: "#8B949E", fontSize: "14px", fontWeight: 600 }}>
              assumptions scan --tests (EXECUTABLE FALSIFICATION TESTS)
            </span>
          </div>
          <span style={{ color: "#3FB950", fontSize: "12px", fontWeight: 800 }}>--tests mode</span>
        </div>

        {/* Terminal Logs & Diff Preview */}
        <div style={{ padding: "30px", fontSize: "18px", lineHeight: "1.85", color: "#C9D1D9" }}>
          <div>
            <span style={{ color: "#3FB950" }}>dev@local:~$</span> assumptions scan --tests
          </div>
          <div style={{ color: "#8B949E", fontSize: "16px" }}>
            Generating executable falsification tests and recommended controls...
          </div>

          {localFrame > 20 && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ color: "#FF3366", fontWeight: 700 }}>
                [P0] test_duplicate_checkout (Falsification Procedure)
              </div>
              <div style={{ color: "#8B949E", fontSize: "15px" }}>
                Submit two identical checkout requests concurrently; assert exactly one charge exists in Stripe.
              </div>
            </div>
          )}

          {/* Recommended Control Diff Preview */}
          {diffSpring > 0 && (
            <div
              style={{
                marginTop: "18px",
                backgroundColor: "#161B22",
                border: "1px solid #30363D",
                borderRadius: "8px",
                padding: "16px",
                transform: `translateY(${(1 - diffSpring) * 10}px)`,
                opacity: diffSpring,
              }}
            >
              <div style={{ color: "#8B949E", fontSize: "14px", marginBottom: "8px" }}>
                RECOMMENDED CONTROL (Reviewable Suggestion):
              </div>
              <div style={{ color: "#3FB950" }}>
                + const idempotencyKey = req.headers["x-idempotency-key"];
              </div>
              <div style={{ color: "#E6EDF3" }}>
                &nbsp;&nbsp;const payment = await stripe.charges.create(&#123;
              </div>
              <div style={{ color: "#3FB950" }}>
                + &nbsp;&nbsp;&nbsp;&nbsp;&#123; idempotencyKey &#125;
              </div>
              <div style={{ color: "#E6EDF3" }}>
                &nbsp;&nbsp;&#125;);
              </div>
            </div>
          )}

          {/* Verified Status Pill */}
          {testPassSpring > 0 && (
            <div
              style={{
                marginTop: "20px",
                padding: "18px",
                backgroundColor: "rgba(35, 134, 54, 0.16)",
                border: "1px solid #238636",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transform: `translateY(${(1 - testPassSpring) * 10}px)`,
                opacity: testPassSpring,
              }}
            >
              <div>
                <div style={{ color: "#3FB950", fontWeight: 800, fontSize: "18px" }}>
                  ✓ STATUS VERIFIED: PROTECTED
                </div>
                <div style={{ color: "#8B949E", fontSize: "14px", marginTop: "4px" }}>
                  Assumptions never modifies code automatically — fixes remain reviewable suggestions until verified.
                </div>
              </div>
              <span
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#238636",
                  color: "#FFF",
                  borderRadius: "6px",
                  fontWeight: 900,
                  fontSize: "14px",
                }}
              >
                PROTECTED
              </span>
            </div>
          )}
        </div>
      </div>

      <SubtitleOverlay text="Every finding ships with a concrete falsification test to prove the failure mode, and a recommended control you can verify before release. Assumptions never auto-mutates your codebase." />
    </AbsoluteFill>
  );
};

// --- Scene 5: Hero Closing & Call To Action ---
const Scene5HeroCTA: React.FC<{ frame: number }> = ({ frame }) => {
  const localFrame = frame - 1460;
  const logoSpring = useSmoothSpring(localFrame, 5);
  const badgeSpring = useSmoothSpring(localFrame, 30);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080A0F",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'JetBrains Mono', monospace",
        color: "#F0F6FC",
        overflow: "hidden",
      }}
    >
      {/* Background Radial Lights */}
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(35, 134, 54, 0.22) 0%, rgba(88, 166, 255, 0.15) 45%, rgba(8, 10, 15, 0) 75%)",
        }}
      />

      <div style={{ textAlign: "center", zIndex: 2 }}>
        <div
          style={{
            fontSize: "80px",
            fontWeight: 900,
            letterSpacing: "-2px",
            background: "linear-gradient(180deg, #FFFFFF 0%, #58A6FF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            transform: `scale(${0.9 + logoSpring * 0.1})`,
            opacity: logoSpring,
          }}
        >
          Assumptions
        </div>

        <p
          style={{
            fontSize: "26px",
            color: "#8B949E",
            marginTop: "16px",
            transform: `translateY(${(1 - logoSpring) * 15}px)`,
            opacity: logoSpring,
          }}
        >
          Find what your code assumes before production proves it wrong.
        </p>

        {/* Real Command Box */}
        <div
          style={{
            marginTop: "40px",
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            padding: "26px 48px",
            backgroundColor: "#161B22",
            border: "1px solid #30363D",
            borderRadius: "16px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7)",
            transform: `translateY(${(1 - badgeSpring) * 15}px)`,
            opacity: badgeSpring,
          }}
        >
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <span style={{ color: "#3FB950", fontSize: "24px" }}>⚡</span>
            <span style={{ fontSize: "24px", fontWeight: 800, color: "#F0F6FC" }}>
              /assumptions-scan
            </span>
            <span style={{ color: "#8B949E", fontSize: "20px" }}>or</span>
            <span style={{ fontSize: "24px", fontWeight: 800, color: "#58A6FF" }}>
              assumptions scan
            </span>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
            <span style={{ fontSize: "14px", padding: "6px 14px", backgroundColor: "#238636", borderRadius: "12px", color: "#FFF", fontWeight: 800 }}>
              100% Local &amp; Private
            </span>
            <span style={{ fontSize: "14px", padding: "6px 14px", backgroundColor: "#21262D", border: "1px solid #30363D", borderRadius: "12px", color: "#8B949E", fontWeight: 800 }}>
              Agent Agnostic
            </span>
            <span style={{ fontSize: "14px", padding: "6px 14px", backgroundColor: "#21262D", border: "1px solid #30363D", borderRadius: "12px", color: "#8B949E", fontWeight: 800 }}>
              Open Source (MIT)
            </span>
          </div>
        </div>
      </div>

      <SubtitleOverlay text="Ship with confidence. Run slash assumptions-scan in your code review workflow, fully local and open source." />
    </AbsoluteFill>
  );
};

// --- Main Composition ---
export const AssumptionsPromo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#080A0F" }}>
      {/* Background Music (Removed per user request) */}

      {/* Female Voiceover Tracks timed to exact scene durations */}
      <Sequence from={0} durationInFrames={265}>
        <Audio src={staticFile("audio/narration/scene1.mp3")} volume={1.0} />
      </Sequence>
      <Sequence from={265} durationInFrames={360}>
        <Audio src={staticFile("audio/narration/scene2.mp3")} volume={1.0} />
      </Sequence>
      <Sequence from={625} durationInFrames={465}>
        <Audio src={staticFile("audio/narration/scene3.mp3")} volume={1.0} />
      </Sequence>
      <Sequence from={1090} durationInFrames={370}>
        <Audio src={staticFile("audio/narration/scene4.mp3")} volume={1.0} />
      </Sequence>
      <Sequence from={1460} durationInFrames={240}>
        <Audio src={staticFile("audio/narration/scene5.mp3")} volume={1.0} />
      </Sequence>

      {/* Synchronized SFX Cues */}
      {frame === 1 && <Audio src={staticFile("audio/impact-movie-intro.mp3")} volume={0.7} />}
      {frame === 265 && <Audio src={staticFile("audio/whoosh-big.mp3")} volume={0.6} />}
      {frame === 300 && <Audio src={staticFile("audio/glitch-electric-small.mp3")} volume={0.5} />}
      {frame === 335 && <Audio src={staticFile("audio/drum-impact-subtle.mp3")} volume={0.6} />}
      {frame === 625 && <Audio src={staticFile("audio/bass-transition-pulse.mp3")} volume={0.7} />}
      {frame === 650 && <Audio src={staticFile("audio/pop.mp3")} volume={0.4} />}
      {frame === 680 && <Audio src={staticFile("audio/pop.mp3")} volume={0.4} />}
      {frame === 710 && <Audio src={staticFile("audio/pop.mp3")} volume={0.4} />}
      {frame === 1090 && <Audio src={staticFile("audio/drum-hit-trailer.mp3")} volume={0.7} />}
      {frame === 1135 && <Audio src={staticFile("audio/keyboard.mp3")} volume={0.5} />}
      {frame === 1175 && <Audio src={staticFile("audio/sparkle.mp3")} volume={0.6} />}
      {frame === 1460 && <Audio src={staticFile("audio/impact-epic-trailer.mp3")} volume={0.8} />}
      {frame === 1490 && <Audio src={staticFile("audio/shimmer-sparkle-sweep.mp3")} volume={0.6} />}

      {/* Scene Switcher */}
      {frame < 265 && <Scene1Hook frame={frame} />}
      {frame >= 265 && frame < 625 && <Scene2RealCase frame={frame} />}
      {frame >= 625 && frame < 1090 && <Scene3LedgerTable frame={frame} />}
      {frame >= 1090 && frame < 1460 && <Scene4Falsification frame={frame} />}
      {frame >= 1460 && <Scene5HeroCTA frame={frame} />}
    </AbsoluteFill>
  );
};
