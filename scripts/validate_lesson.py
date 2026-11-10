"""Validate a law-to-visual design contract, not the truth of its physics."""
import argparse
import json
from pathlib import Path

FIELDS = ('id', 'question', 'law', 'assumptions', 'quantities', 'encoding', 'target', 'interaction', 'expected', 'test')

def validate(lesson):
    if not isinstance(lesson.get('title'), str) or not lesson['title'].strip():
        raise ValueError('lesson.title is required')
    rows = lesson.get('visualPlan')
    if not isinstance(rows, list) or not rows:
        raise ValueError('visualPlan required: connect each key physical relationship to a visual test')
    ids = set()
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError('visualPlan rows must be objects')
        for field in FIELDS:
            if not isinstance(row.get(field), str) or not row[field].strip():
                raise ValueError(f'visualPlan.{field} must be nonempty text')
        if row['id'] in ids:
            raise ValueError('Duplicate visualPlan id: ' + row['id'])
        ids.add(row['id'])
        if row['encoding'].strip().lower() in ('text', 'formula', '文字', '公式', '动画'):
            raise ValueError('Encoding must name an observable mechanism, not just a caption')
    return {'relationships': len(rows), 'ids': sorted(ids), 'scope': 'Structure only; execute physical and browser tests separately.'}

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('lesson')
    args=parser.parse_args()
    print(json.dumps(validate(json.loads(Path(args.lesson).read_text(encoding='utf-8'))), ensure_ascii=False))
