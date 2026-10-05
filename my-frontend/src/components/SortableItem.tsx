import React from "react";

export function SortableItem({
  index,
  editable,
  isDragTarget,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemove,
  children,
}: {
  index: number;
  editable: boolean;
  isDragTarget: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onRemove: (index: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      draggable={editable}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart(index);
      }}
      onDragOver={(e) => {
        e.preventDefault(); // WYMAGANE, aby onDrop zadziałało
        e.dataTransfer.dropEffect = "move";
        onDragOver(index);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
      style={{
        position: "relative",
        cursor: editable ? "grab" : "default",
        outline: isDragTarget ? "2px dashed #2563eb" : "none",
        outlineOffset: 4,
        borderRadius: 16,
        transition: "outline 0.1s",
      }}
    >
      {editable && (
        <button
          onClick={() => onRemove(index)}
          onPointerDown={(e) => e.stopPropagation()} // zapobiega starcie przeciągania po kliknięciu ×
          title="Usuń sekcję"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 10,
            width: 28,
            height: 28,
            borderRadius: 999,
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#ef4444",
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          }}
        >
          ×
        </button>
      )}
      {children}
    </div>
  );
}
