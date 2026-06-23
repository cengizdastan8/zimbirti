import json
log_path = r'C:\Users\Mel\.gemini\antigravity-ide\brain\4d1a60f7-a2e0-4bbf-af0b-03529c209f98\.system_generated\logs\transcript.jsonl'
try:
    with open(log_path, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                data = json.loads(line)
                if 'tool_calls' in data:
                    for call in data['tool_calls']:
                        tool = call.get('tool_name', '')
                        if tool in ['default_api:write_to_file', 'default_api:multi_replace_file_content', 'default_api:replace_file_content', 'default_api:run_command']:
                            args = call.get('tool_args', {})
                            if 'page.tsx' in str(args):
                                print(f"Step {data.get('step_index')}: {tool}")
            except Exception as e:
                pass
except Exception as e:
    print(e)
