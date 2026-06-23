import json
log_path = r'C:\Users\Mel\.gemini\antigravity-ide\brain\4d1a60f7-a2e0-4bbf-af0b-03529c209f98\.system_generated\logs\transcript.jsonl'
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('source') == 'MODEL' and data.get('type') == 'PLANNER_RESPONSE':
                content = data.get('content', '') or data.get('thinking', '')
                if 'export default function Home' in content or 'className' in content:
                    print(f"Found code in PLANNER_RESPONSE at step {data.get('step_index')}")
                    with open(f"model_thought_{data.get('step_index')}.txt", 'w', encoding='utf-8') as out:
                        out.write(content)
        except Exception as e:
            pass
