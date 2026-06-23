import json
log_path = r'C:\Users\Mel\.gemini\antigravity-ide\brain\4d1a60f7-a2e0-4bbf-af0b-03529c209f98\.system_generated\logs\transcript.jsonl'
try:
    with open(log_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                if 'tool_calls' in data:
                    for call in data['tool_calls']:
                        tool = call.get('name', '')
                        if tool in ['write_to_file', 'replace_file_content', 'multi_replace_file_content']:
                            args = call.get('args', {})
                            if 'page.tsx' in str(args):
                                print(f"Step {data.get('step_index')}: {tool}")
                                if tool == 'write_to_file':
                                    content = args.get('CodeContent', '')
                                    if len(content) > 1000:
                                        with open(f"page_backup_{data.get('step_index')}.tsx", 'w', encoding='utf-8') as out:
                                            out.write(content)
                                        print(f"  SAVED TO page_backup_{data.get('step_index')}.tsx!")
            except Exception as e:
                pass
except Exception as e:
    print(e)
