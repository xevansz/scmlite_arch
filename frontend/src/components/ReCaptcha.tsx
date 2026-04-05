import React, { forwardRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface ReCaptchaProps {
  onChange: (token: string | null) => void;
  error?: string | null;
}

const VITE_RECAPTCHA_SITE_KEY="6LdipRksAAAAACiVBQI_mpkRF4uh8y9ymfj_wjaf";

export const ReCaptcha = forwardRef<ReCAPTCHA, ReCaptchaProps>(({ onChange, error }, ref) => {
  return (
    <div className="mt-4">
      <ReCAPTCHA
        sitekey={VITE_RECAPTCHA_SITE_KEY}
        onChange={onChange}
        ref={ref}
        size="normal"
        theme="dark"
      />
      {error && (
        <div className="text-red-400 text-sm mt-1">{error}</div>
      )}
    </div>
  );
});

ReCaptcha.displayName = 'ReCaptcha';
