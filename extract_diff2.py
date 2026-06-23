import json
log_path = r'C:\Users\Mel\.gemini\antigravity-ide\brain\4d1a60f7-a2e0-4bbf-af0b-03529c209f98\.system_generated\logs\transcript.jsonl'
try:
    with open(log_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                if data.get('source') == 'SYSTEM' and data.get('type') == 'TOOL_RESPONSE':
                    content = data.get('content', '')
                    if 'diff --git' in content or 'diff' in content:
                        print(f"Found diff at step {data.get('step_index')}")
                        with open(f"diff_{data.get('step_index')}.txt", 'w', encoding='utf-8') as out:
                            out.write(content)
            except Exception as e:
                pass
except Exception as e:
    print(e)
