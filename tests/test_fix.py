from src.reference_resolver import resolve_reference

def test_resolve_reference():
    data = {'drafts': [{'id': 1}, {'id': 2}], 'status': 200}
    assert resolve_reference(data, 'drafts.0.id') == 1
    assert resolve_reference(data, 'drafts.1.id') == 2
    assert resolve_reference(data, 'status') == 200
    assert resolve_reference(data, 'nonexistent') is None