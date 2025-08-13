import { Mailbox } from 'lucide-react';
import { TodoDetails } from './todo-details';
import { useTodosState } from './todos-state-provider';

function TodoView() {
    const [selectedTodo, setSelectedTodo, updateTodoStatus] = useTodosState((state) => [state.selectedTodo, state.setSelectedTodo, state.updateTodoStatus]);
    
    if (!selectedTodo) {
        return (
            <div className="w-full flex flex-col items-center justify-center overflow-hidden p">
                <Mailbox className="w-16 h-16" />
                <p className="text-muted-foreground">
                    Click on a todo to view details
                </p>
            </div>
        );
    }

    return (
        <div className="h-full w-full ">
            <TodoDetails todo={selectedTodo} onClose={() => {
                setSelectedTodo(null);
            }} updateTodoStatus={updateTodoStatus} />
        </div>
    );
}

export { TodoView };