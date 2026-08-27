import React, { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { OpenUIRenderer } from "./OpenUIRenderer";
import { useAgent } from "./useAgent";
import { ChatInputPanel } from "./components/ChatInputPanel";
import { HitlModal } from "./components/HitlModal";
import { LogsDrawer } from "./components/LogsDrawer";

export default function App() {
  const {
    status,
    logs,
    openuiResponse,
    error,
    send,
    hitlOpen,
    hitlSql,
    hitlExplanation,
    approveSql,
    rejectSql,
  } = useAgent();

  const pdfRef = useRef<HTMLDivElement>(null);

  
  const findSafeCut = (canvasHeight, startY, idealHeight, cutPoints, keepTogetherBlocks = []) => {
	  const maxCut = Math.min(startY + idealHeight, canvasHeight);

	  if (maxCut >= canvasHeight) return canvasHeight - startY;

	 
	  let blockingBlock = null;
	  for (const block of keepTogetherBlocks) {
	    if (block.top < maxCut && block.bottom > maxCut) {
		  blockingBlock = block;
		  break;
	    }
	  }

	  if (blockingBlock) {
	    const safeBlockTop = Math.max(startY, blockingBlock.top - 8);

	    if (safeBlockTop > startY) {
		  let bestBeforeBlock = -1;
		  for (const cp of cutPoints) {
		    if (cp > startY && cp <= safeBlockTop) {
			  bestBeforeBlock = cp;
		    } else if (cp > safeBlockTop) {
			  break;
		    }
		  }

		  if (bestBeforeBlock > startY) {
		    return bestBeforeBlock - startY;
		  }

		  return safeBlockTop - startY;
	    }
	    return idealHeight;
	  }

	  
	  let best = -1;
	  for (const cp of cutPoints) {
	    if (cp > startY && cp <= maxCut) {
		  best = cp;
	    } else if (cp > maxCut) {
		  break;
	    }
	  }

	  if (best > startY) {
	    const maxUnusedSpace = 120;
	    if (maxCut - best <= maxUnusedSpace) {
		  return best - startY;
	    }
	  }

	 
	  return idealHeight;
	};
	
 
  const drawRoundedSlice = (source, startY, sliceHeight, radius, padTopPx = 0, padBottomPx = 0) => {
	  const slice = document.createElement("canvas");
	  slice.width = source.width;
	  slice.height = sliceHeight + padTopPx + padBottomPx;   

	  const ctx = slice.getContext("2d");
	  if (!ctx) return null;

	  const w = slice.width;
	  const h = slice.height;
	  const r = Math.min(radius, w / 2, h / 2);

	  ctx.clearRect(0, 0, w, h);


	  ctx.beginPath();
	  ctx.moveTo(r, 0);
	  ctx.lineTo(w - r, 0);
	  ctx.arcTo(w, 0, w, r, r);
	  ctx.lineTo(w, h - r);
	  ctx.arcTo(w, h, w - r, h, r);
	  ctx.lineTo(r, h);
	  ctx.arcTo(0, h, 0, h - r, r);
	  ctx.lineTo(0, r);
	  ctx.arcTo(0, 0, r, 0, r);
	  ctx.closePath();

	  ctx.save();
	  ctx.clip();


	  ctx.fillStyle = "#f3f8ff";
	  ctx.fillRect(0, 0, w, h);


	  ctx.drawImage(
		source,
		0, startY, source.width, sliceHeight,
		0, padTopPx, source.width, sliceHeight
	  );

	  ctx.restore();
	  return slice;
	};


  
  const exportToPdf = async () => {
	  if (!pdfRef.current) return;

	  const element = pdfRef.current;
	  const exportWidth = Math.max(1600, element.scrollWidth);

	  const previousWidth = element.style.width;
	  const previousMaxWidth = element.style.maxWidth;
	  const previousOverflow = element.style.overflow;
	  const previousHeight = element.style.height;
	  const previousMaxHeight = element.style.maxHeight;
	  const previousScrollTop = element.scrollTop;
	  const previousBackground = element.style.background;
	  const previousBorderRadius = element.style.borderRadius;
	  const previousPaddingBottom = element.style.paddingBottom;
	  const previousBoxSizing = element.style.boxSizing;
	  const previousBorder = element.style.border;

	  element.style.width = `${exportWidth}px`;
	  element.style.maxWidth = `${exportWidth}px`;
	  element.style.overflow = "visible";
	  element.style.height = "auto";
	  element.style.maxHeight = "none";
	  element.style.background = "transparent";
	  element.style.borderRadius = "0px";
	  element.style.paddingBottom = "0px";
	  element.style.boxSizing = "border-box";
	  element.scrollTop = 0;
	  element.style.border = "none"; 

	  const downloadButtons = Array.from(element.querySelectorAll("*"))
		.filter((el) => el.textContent?.trim().toLowerCase() === "download to excel")
		.map((el) => el.closest("button, [role='button'], a") || (el.tagName === "SPAN" ? el.parentElement : el) || el)
		.filter((el, index, arr) => el && arr.indexOf(el) === index);
	  const previousDownloadButtonsDisplay = downloadButtons.map((btn) => btn.style.display);
	  downloadButtons.forEach((btn) => {
		btn.style.display = "none";
	  });

	  window.dispatchEvent(new Event("resize"));
	  await new Promise((resolve) => setTimeout(resolve, 500));

	  const fullWidth = element.offsetWidth;
	  const fullHeight = element.scrollHeight;

	  element.style.height = `${fullHeight}px`;
	  await new Promise((resolve) => setTimeout(resolve, 50));

	  const canvas = await html2canvas(element, {
		scale: 2,
		useCORS: true,
		backgroundColor: null,
		width: fullWidth,
		height: fullHeight,
		windowWidth: fullWidth,
		windowHeight: fullHeight,
		scrollX: 0,
		scrollY: 0,
	  });


	  const SCALE = 2;
	  const elemTop = element.getBoundingClientRect().top;
	  const breakEls = element.querySelectorAll("tr, [data-pdf-break]");
	  const cutPoints = [];
	  breakEls.forEach((el) => {
		const rect = el.getBoundingClientRect();
		cutPoints.push(Math.round((rect.bottom - elemTop) * SCALE));
	  });
	  cutPoints.sort((a, b) => a - b);

	  const findKeepTogetherContainer = (el) => {
		let candidate = el.closest("[data-pdf-keep-together], section, article") || el.closest(".recharts-wrapper") || el;
		let current = candidate;

		for (let i = 0; i < 4; i++) {
		  const parent = current.parentElement;
		  if (!parent || parent === element) break;

		  const parentRect = parent.getBoundingClientRect();
		  const currentRect = current.getBoundingClientRect();
		  const currentHasHeading = !!current.querySelector?.("h1, h2, h3, h4, h5, h6, [data-pdf-section-title]");
		  const parentHasHeading = !!parent.querySelector?.("h1, h2, h3, h4, h5, h6, [data-pdf-section-title]");

		  if (
			parentRect.height <= currentRect.height + 220 ||
			(!currentHasHeading && parentHasHeading && parentRect.height <= currentRect.height + 320)
		  ) {
			current = parent;
			candidate = parent;
		  } else {
			break;
		  }
		}

		return candidate;
	  };

	  const keepTogetherBlocks = [];
	  const seenBlocks = new Set();
	  const keepTogetherEls = element.querySelectorAll("section, article, canvas, svg, .recharts-wrapper, [data-pdf-keep-together], h1, h2, h3, h4, h5, h6, [data-pdf-section-title]");
	  keepTogetherEls.forEach((el) => {
		const block = findKeepTogetherContainer(el);
		if (!block || seenBlocks.has(block) || block === element) return;

		const rect = block.getBoundingClientRect();
		const top = Math.round((rect.top - elemTop) * SCALE);
		const bottom = Math.round((rect.bottom - elemTop) * SCALE);

		if (bottom > top) {
		  keepTogetherBlocks.push({ top, bottom });
		  seenBlocks.add(block);
		}
	  });
	  keepTogetherBlocks.sort((a, b) => a.top - b.top);
	  // -------------------------------------------------------------

	  downloadButtons.forEach((btn, index) => {
		btn.style.display = previousDownloadButtonsDisplay[index];
	  });

	  element.style.width = previousWidth;
	  element.style.maxWidth = previousMaxWidth;
	  element.style.overflow = previousOverflow;
	  element.style.height = previousHeight;
	  element.style.maxHeight = previousMaxHeight;
	  element.style.background = previousBackground;
	  element.style.borderRadius = previousBorderRadius;
	  element.style.paddingBottom = previousPaddingBottom;
	  element.style.boxSizing = previousBoxSizing;
	  element.scrollTop = previousScrollTop;
	  element.style.border = previousBorder; 

	  const pdf = new jsPDF("l", "mm", "a4");
	  const pageWidth = pdf.internal.pageSize.getWidth();
	  const pageHeight = pdf.internal.pageSize.getHeight();

	  const margin = 6;
	  const titleY = 8;
	  const topOffset = 12;

	  const availableWidth = pageWidth - margin * 2;
	  const availableHeight = pageHeight - topOffset - margin;

	  pdf.setFont("helvetica", "bold");
	  pdf.setFontSize(12);
	  pdf.text("OpenUI Result", margin, titleY);

	  const pageHeightPx = Math.floor((canvas.width * availableHeight) / availableWidth);

	  const cornerRadius = 28 * 2;
	  const padTop = 20 * 2;
	  const padBottom = 20 * 2;
	  let renderedHeight = 0;
	  let pageIndex = 0;

	  while (renderedHeight < canvas.height) {
		const remainingHeight = canvas.height - renderedHeight;
		const contentHeightPx = pageHeightPx - padTop - padBottom;
		const idealHeight = Math.min(contentHeightPx, remainingHeight);
		

		const sliceHeight = findSafeCut(canvas.height, renderedHeight, idealHeight, cutPoints, keepTogetherBlocks);

		const sliceCanvas = drawRoundedSlice(canvas, renderedHeight, sliceHeight, cornerRadius, padTop, padBottom);
		if (!sliceCanvas) break;

		if (pageIndex > 0) pdf.addPage();

		const imgData = sliceCanvas.toDataURL("image/png");
		
		let imgHeight = (sliceCanvas.height * availableWidth) / canvas.width;
		if (imgHeight > availableHeight) {
		  imgHeight = availableHeight;
		}

		pdf.addImage(imgData, "PNG", margin, topOffset, availableWidth, imgHeight);

		renderedHeight += sliceHeight;
		pageIndex++;
	  }

	  pdf.save("openui-result.pdf");
  };

  const getStatusStyle = () => {
    switch (status) {
      case "running":
        return {
          background: "#dbeafe",
          color: "#1d4ed8",
          label: "Running",
        };
      case "waiting_hitl":
        return {
          background: "#e0f2fe",
          color: "#0369a1",
          label: "Waiting for approval",
        };
      case "completed":
        return {
          background: "#dcfce7",
          color: "#047857",
          label: "Completed",
        };
      case "error":
        return {
          background: "#fee2e2",
          color: "#b91c1c",
          label: "Error",
        };
      default:
        return {
          background: "#e0f2fe",
          color: "#0369a1",
          label: "Ready",
        };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        height: "100vh",
        background:
          "linear-gradient(180deg, #f4f9ff 0%, #eef6ff 45%, #eaf4ff 100%)",
        gap: 20,
        padding: 20,
        boxSizing: "border-box",
        color: "#0f172a",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <aside
        style={{
          background: "rgba(255,255,255,0.92)",
          border: "1px solid #dbeafe",
          borderRadius: 24,
          padding: 24,
          boxShadow: "0 10px 30px rgba(59, 130, 246, 0.08)",
          overflow: "auto",
          backdropFilter: "blur(6px)",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#3b82f6",
              marginBottom: 8,
            }}
          >
            AI SQL Assistant
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 30,
              lineHeight: 1.1,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            Ask your data
          </h1>

          <p
            style={{
              marginTop: 12,
              marginBottom: 0,
              fontSize: 15,
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            Enter your business question and review a dynamically generated
            OpenUI result.
          </p>
        </div>

        <ChatInputPanel
          onSend={send}
          disabled={status === "running" || status === "waiting_hitl"}
        />
      </aside>

      <main
        style={{
          minHeight: 0,
          background: "rgba(255,255,255,0.96)",
          border: "1px solid #dbeafe",
          borderRadius: 24,
          padding: 24,
          overflow: "auto",
          boxShadow: "0 12px 40px rgba(59, 130, 246, 0.10)",
          backdropFilter: "blur(6px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#3b82f6",
                marginBottom: 8,
              }}
            >
              Generated result
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: 30,
                lineHeight: 1.1,
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              OpenUI Output
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={exportToPdf}
              disabled={!openuiResponse}
              style={{
                border: "none",
                borderRadius: 14,
                background: openuiResponse
                  ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                  : "#bfdbfe",
                color: "white",
                padding: "12px 16px",
                fontSize: 14,
                fontWeight: 700,
                cursor: openuiResponse ? "pointer" : "not-allowed",
                boxShadow: openuiResponse
                  ? "0 10px 20px rgba(37, 99, 235, 0.20)"
                  : "none",
              }}
            >
              Export to PDF
            </button>

            <div
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: statusStyle.background,
                color: statusStyle.color,
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {statusStyle.label}
            </div>
          </div>
        </div>

        <div
          ref={pdfRef}
          style={{
            flex: 1,
            minHeight: 0,
            background: "#f8fbff",
            border: "1px solid #e0ecff",
            borderRadius: 20,
            padding: 20,
            overflow: "auto",
          }}
        >
          {error ? (
            <div
              style={{
                border: "1px solid #fecaca",
                background: "#fff1f2",
                color: "#b91c1c",
                borderRadius: 16,
                padding: 16,
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {error}
            </div>
          ) : openuiResponse ? (
            <OpenUIRenderer response={openuiResponse} />
          ) : (
            <div
              style={{
                height: "100%",
                minHeight: 280,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "#64748b",
                fontSize: 15,
                lineHeight: 1.7,
                padding: 24,
              }}
            >
              The generated OpenUI result will appear here after you submit a
              question.
            </div>
          )}
        </div>
      </main>

      <LogsDrawer logs={logs} />

      <HitlModal
        open={hitlOpen}
        sql={hitlSql}
        explanation={hitlExplanation}
        onApprove={approveSql}
        onReject={rejectSql}
      />
    </div>
  );
}
