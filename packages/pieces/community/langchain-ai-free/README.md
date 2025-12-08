# 🤖 LangChain AI Free

[![Upgrade to PRO](https://img.shields.io/badge/UPGRADE_TO_PRO-MultiAgentPro.ai-blue?style=for-the-badge)](https://multiagentpro.ai)

The free version of **MultiAgentPro.ai**, designed for fast, reliable, single-agent and multi-step AI automations inside Activepieces.

---

## ⚠️ UPGRADE TO PRO AVAILABLE

Unlock advanced features:

- Multi-Agent Orchestration (Planner → Worker → Verifier)  
- Vector Memory (RAG)  
- Advanced Tool Calling (browser, websearch, code, file tools)  
- Intelligent LLM Routing (cost-aware, latency-aware)  
- Full PRO Debug Timeline  
- No step limits  
- Unlimited reasoning depth  

👉 **Upgrade to PRO:**  
https://multiagentpro.ai

---

## 🟢 Free Edition Features

### ✓ Single-Step Agent  
A fast, lightweight LLM agent with optional conversational memory.

### ✓ Multi-Step Agent (max 8 steps)  
Iterative reasoning with guided step-by-step thinking.  
Free Edition limit: **8 steps** per execution.

### ✓ Supported Providers  
- OpenAI  
- Anthropic Claude  
- Google Gemini  
- Auto Routing (basic version)

### ✓ Simple Memory  
Conversational history only (no vector RAG).

### ✓ Basic Timeline  
Tracks provider, routing, messages, and reasoning steps.

---

## 🔒 PRO Features (via MultiAgentPro.ai)

### 🚀 Multi-Agent Orchestration  
A full pipeline of intelligent agents:
1. Planner  
2. Worker  
3. Verifier  
4. Feedback Loop  

### 🔍 Vector Memory (RAG)  
- ChromaDB / SQLite  
- Embeddings  
- Fast semantic retrieval  
- Document ingestion  

### 🛠 Advanced Tools  
- Browser automation  
- Web search  
- Code execution  
- File operations  
- Data extraction  

### ⚡ Intelligent LLM Routing  
- Smart model selection  
- Cost optimization  
- Latency-aware routing  
- Automatic provider fallback  

### 🔎 PRO Debug Timeline  
- Full agent trace  
- Tool-call logs  
- Token usage  
- Cost breakdown  

### 🔐 Licensing via API Key  
Powered by MultiAgentPro.ai (Stripe licensing & workspace access).

👉 Explore PRO:  
https://multiagentpro.ai

---

## 📘 About the Free Edition

This piece provides a solid foundation for building AI agents inside your Activepieces

- System + user prompts  
- Context JSON  
- Simple conversational memory  
- Multi-provider support  
- Step-by-step reasoning  
- Basic timeline  

**Free Edition Limit:**  
Max **8 steps** per execution.

If exceeded, the action returns:
```json
{
  "error": "Feature Pro",
  "message": "To use more than 8 steps or Multi-Agent Orchestration, upgrade to PRO.",
  "upgradeUrl": "https://multiagentpro.ai",
  "currentLimit": 8
}

📦 Actions Included
1. Run Single-Step Agent

One-shot reasoning with optional memory and routing.

2. Run Multi-Step Agent

Iterative reasoning up to 8 steps (Free edition limit).
For unlimited steps → PRO.

🌐 Official PRO Website

https://multiagentpro.ai

👨‍💻 Author

lau90eth

🧩 Compatibility

Activepieces 0.24.0+

Node 20

Nx Monorepo compatible

