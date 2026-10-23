"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  imageUrl: string | null;
  userName?: string;
}

export function ImagePreviewDialog({
  open,
  onOpenChange,
  title,
  imageUrl,
  userName,
}: ImagePreviewDialogProps) {
  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-2xl" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          {userName && (
            <p className="text-xs text-slate-500">
              Pemilik Identitas: <strong>{userName}</strong>
            </p>
          )}
        </DialogHeader>

        <div className="relative my-2 max-h-[70vh] overflow-hidden rounded-xl border border-slate-200 bg-slate-950 flex items-center justify-center p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm"
          />
        </div>

        <DialogFooter className="flex items-center justify-between">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Buka Gambar Asli</span>
          </a>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
