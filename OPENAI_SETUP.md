# OpenAI Configuration Guide for ForgeAI

ForgeAI is now fully compatible with OpenAI's API. This guide explains how to set up OpenAI models.

## Environment Variables

Add these variables to your `.env` file:

```env
# OpenAI API Key - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-proj-your-actual-api-key-here"

# OpenAI Model Name - Choose from available models
OPENAI_MODEL_NAME="gpt-4o"

# OpenAI API Endpoint - Use OpenAI's official endpoint or a compatible service
OPENAI_API_ENDPOINT="https://api.openai.com/v1"
```

## Configuration Options

### OPENAI_API_KEY (Required)
- Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Format: `sk-proj-...` (starts with `sk-proj-`)
- Keep this secret and never commit to version control

### OPENAI_MODEL_NAME (Optional - Defaults to "gpt-4o")
Available models for code generation and reasoning:

| Model | Use Case | Cost | Speed |
|-------|----------|------|-------|
| `gpt-4o` | Full code generation (default) | High | Medium |
| `gpt-4-turbo` | Complex reasoning tasks | High | Medium |
| `gpt-4` | Advanced logic & coding | High | Slow |
| `gpt-3.5-turbo` | Lightweight tasks | Low | Fast |

**Recommended:**
- For best results: `gpt-4o` or `gpt-4-turbo`
- For quick testing: `gpt-3.5-turbo`
- For production: `gpt-4o`

### OPENAI_API_ENDPOINT (Optional - Defaults to OpenAI's official endpoint)

#### Official OpenAI
```env
OPENAI_API_ENDPOINT="https://api.openai.com/v1"
```

#### Azure OpenAI
```env
OPENAI_API_ENDPOINT="https://<your-resource-name>.openai.azure.com/v1"
OPENAI_API_KEY="<your-azure-key>"
```

#### OpenRouter (Compatible with OpenAI API)
```env
OPENAI_API_ENDPOINT="https://openrouter.ai/api/v1"
OPENAI_API_KEY="sk-or-..." # OpenRouter key
OPENAI_MODEL_NAME="openai/gpt-4o" # Use openai/ prefix for OpenRouter
```

#### Together AI (Compatible with OpenAI API)
```env
OPENAI_API_ENDPOINT="https://api.together.xyz/v1"
OPENAI_API_KEY="<your-together-key>"
OPENAI_MODEL_NAME="meta-llama/Llama-3-70b-chat-hf"
```

#### Groq (Compatible with OpenAI API)
```env
OPENAI_API_ENDPOINT="https://api.groq.com/openai/v1"
OPENAI_API_KEY="gsk_..." # Groq key
OPENAI_MODEL_NAME="mixtral-8x7b-32768"
```

## Complete Setup Examples

### Using Official OpenAI GPT-4o
```env
OPENAI_API_KEY="sk-proj-xyz123..."
OPENAI_MODEL_NAME="gpt-4o"
OPENAI_API_ENDPOINT="https://api.openai.com/v1"
```

### Using Azure OpenAI
```env
OPENAI_API_KEY="your-azure-key-here"
OPENAI_MODEL_NAME="gpt-4" # Your deployed model name
OPENAI_API_ENDPOINT="https://your-resource.openai.azure.com/v1"
```

### Using OpenRouter (Supports Multiple Providers)
```env
OPENAI_API_KEY="sk-or-your-openrouter-key"
OPENAI_MODEL_NAME="openai/gpt-4o"
OPENAI_API_ENDPOINT="https://openrouter.ai/api/v1"
```

### Using Groq (Fastest Inference)
```env
OPENAI_API_KEY="gsk-your-groq-key"
OPENAI_MODEL_NAME="mixtral-8x7b-32768"
OPENAI_API_ENDPOINT="https://api.groq.com/openai/v1"
```

## Setting Up OpenAI Account

1. **Create Account**: Go to [OpenAI](https://openai.com)
2. **Get API Key**: Visit [API Keys](https://platform.openai.com/api-keys)
3. **Create New Key**: Click "Create new secret key"
4. **Copy & Save**: Store in your `.env` file
5. **Set Billing**: Add payment method in [Billing Settings](https://platform.openai.com/account/billing/overview)

## Models Used in ForgeAI

ForgeAI uses two types of models:

### 1. Code Agent (codeAgent)
- **Purpose**: Generate production-quality code
- **Uses**: Main model specified by `OPENAI_MODEL_NAME`
- **Default**: `gpt-4o`
- **Location**: `inngest/functions.ts` - codeAgent

### 2. Naming Agent (metadataAgent)
- **Purpose**: Generate project names
- **Uses**: Model specified by `OPENAI_MODEL_NAME`
- **Default**: `gpt-4o-mini` (automatically uses mini variant for faster naming)
- **Location**: `inngest/functions.ts` - metadataAgent

## Testing Your Configuration

1. **Start dev server**:
```bash
npm run dev
```

2. **Send a message** from the AI chatbox (e.g., "Build a simple counter app")

3. **Check console logs** for:
```
[projects POST] Creating project with message: ...
[projects POST] Project created: <uuid>
[projects POST] Inngest event sent successfully
```

4. **Monitor server logs** for API calls to OpenAI:
```
[codeAgentFunction] API call to OpenAI...
```

## Pricing & Cost

- **GPT-4o**: ~$0.03/1K input tokens, ~$0.06/1K output tokens
- **GPT-3.5-turbo**: ~$0.0005/1K input tokens, ~$0.0015/1K output tokens

**Typical cost per code generation**: $0.50 - $2.00 depending on model and code complexity

## Troubleshooting

### 401 Unauthorized
- Check `OPENAI_API_KEY` is correct
- Verify key is not expired
- Make sure key has required permissions

### 429 Too Many Requests
- You're hitting rate limits
- Add delay between requests
- Upgrade your OpenAI plan
- System has automatic retry with exponential backoff

### 503 Service Unavailable
- OpenAI API is temporarily down
- Wait a few minutes and try again
- System automatically retries with backoff

### Wrong Endpoint Error
- Verify `OPENAI_API_ENDPOINT` is correct for your service
- Check trailing slashes and URL format
- For Azure, include the full path

## Switching Between Providers

To switch from one provider to another, simply update your environment variables and restart:

```bash
# Stop server
Ctrl+C

# Update .env with new provider details
# Edit .env file

# Restart
npm run dev
```

## Additional Notes

- All retries are automatic with exponential backoff (1s, 2s, 4s)
- The system logs all API errors for debugging
- Frontend shows real-time status updates via Inngest
- Code generation runs in isolated E2B sandboxes for safety
