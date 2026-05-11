CREATE TABLE IF NOT EXISTS onboarding_submissions (
  id BIGSERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  other_names VARCHAR(150),
  email VARCHAR(190) NOT NULL,
  phone_number VARCHAR(30) NOT NULL,
  training_interest VARCHAR(100) NOT NULL,
  learning_device VARCHAR(50) NOT NULL,
  whatsapp_consent BOOLEAN NOT NULL DEFAULT true,
  schedule_email_consent BOOLEAN NOT NULL DEFAULT true,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_onboarding_email ON onboarding_submissions(email);
CREATE INDEX IF NOT EXISTS idx_onboarding_phone ON onboarding_submissions(phone_number);
CREATE INDEX IF NOT EXISTS idx_onboarding_submitted_at ON onboarding_submissions(submitted_at DESC);
