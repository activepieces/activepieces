from src.validator import validate_reference

def test_validate_project_variable_reference():
    flow_steps = ['step_1']
    ref = "variables['ATOMIC_CLAIM_API_TOKEN']"
    assert validate_reference(ref, flow_steps) is True

def test_validate_missing_step_reference():
    flow_steps = ['step_1']
    ref = "steps.non_existent.output"
    assert validate_reference(ref, flow_steps) is False