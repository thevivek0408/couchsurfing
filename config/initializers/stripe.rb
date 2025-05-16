if Rails.application.credentials.dig(:stripe, :secret_key)
  Rails.configuration.stripe = {
    publishable_key: Rails.application.credentials.dig(:stripe, :publishable_key),
    secret_key: Rails.application.credentials.dig(:stripe, :secret_key)
  }
  Stripe.api_key = Rails.configuration.stripe[:secret_key]
else
  Rails.logger.warn("Stripe credentials are missing. Stripe integration disabled.")
end
