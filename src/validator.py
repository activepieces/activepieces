def validate_reference(ref, flow_steps):
    if ref.startswith('variables['):
        return True
    if ref.startswith('steps.'):
        step_name = ref.split('.')[1]
        return step_name in flow_steps
    return False