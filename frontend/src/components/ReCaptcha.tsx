import { forwardRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface ReCaptchaProps {
  onChange: (token: string | null) => void;
  error?: string | null;
}

export const ReCaptcha = forwardRef<ReCAPTCHA, ReCaptchaProps>(({ onChange, error }, ref) => {
  return (
    <div className="mt-4">
      <ReCAPTCHA
        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY as string}
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
