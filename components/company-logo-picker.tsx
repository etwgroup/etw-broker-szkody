"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { Building2, ImagePlus, Trash2 } from "lucide-react";
import { validateCompanyLogo } from "@/lib/company-logo";

type CompanyLogoPickerProps = {
  id: string;
  value: File | null;
  currentLogoUrl?: string | null;
  currentLogoWillBeRemoved?: boolean;
  disabled?: boolean;
  allowCurrentRemoval?: boolean;
  onChange: (file: File | null) => void;
  onCurrentRemovalChange?: (remove: boolean) => void;
  onValidationError: (message: string | null) => void;
};

export function CompanyLogoPicker({
  id,
  value,
  currentLogoUrl = null,
  currentLogoWillBeRemoved = false,
  disabled = false,
  allowCurrentRemoval = false,
  onChange,
  onCurrentRemovalChange,
  onValidationError,
}: CompanyLogoPickerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    const nextPreviewUrl = URL.createObjectURL(value);
    setPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [value]);

  const selectLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      onChange(null);
      onValidationError(null);
      return;
    }
    const validationError = validateCompanyLogo(file);
    if (validationError) {
      event.target.value = "";
      onChange(null);
      onValidationError(validationError);
      return;
    }
    onValidationError(null);
    onCurrentRemovalChange?.(false);
    onChange(file);
  };

  const visibleLogoUrl = previewUrl || (!currentLogoWillBeRemoved ? currentLogoUrl : null);

  return <div className="company-logo-picker">
    <div className="company-logo-picker__preview" aria-label="Podgląd logo firmy">
      {visibleLogoUrl ? <img src={visibleLogoUrl} alt="Logo firmy administrującej"/> : <Building2 size={23}/>} 
    </div>
    <div className="company-logo-picker__controls">
      <label htmlFor={id}>Logo firmy <span>— opcjonalnie</span></label>
      <input id={id} type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" onChange={selectLogo} disabled={disabled}/>
      <p>PNG, JPG lub WebP · maks. 2 MB</p>
      {value && <strong><ImagePlus size={13}/> Wybrano: {value.name}</strong>}
      {allowCurrentRemoval && currentLogoUrl && !value && !currentLogoWillBeRemoved && <button type="button" className="company-logo-picker__remove" onClick={() => onCurrentRemovalChange?.(true)} disabled={disabled}><Trash2 size={13}/> Usuń obecne logo</button>}
      {currentLogoWillBeRemoved && !value && <button type="button" className="company-logo-picker__undo" onClick={() => onCurrentRemovalChange?.(false)} disabled={disabled}>Pozostaw obecne logo</button>}
    </div>
  </div>;
}
