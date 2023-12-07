type Step = {
    name: string;
    nextAction?: Step,
};

type StepWithParent = {
    step: Step;
    parentStep?: Step;
}

type SingleStep = Omit<Step, "nextAction">

class StepManager {
    sourceStep: Step;

    constructor(sourceStep: Step) {
        this.sourceStep = JSON.parse(JSON.stringify(sourceStep));
    }

    updateAction(stepName: string, attributes: SingleStep) : Step {
        let clonedSourceStep = JSON.parse(JSON.stringify(this.sourceStep));

        const stepWithParent = this.findStepByName(clonedSourceStep, stepName);

        if(!stepWithParent)
            throw new Error('Step can\'t be found!');

        const updatedStep = { ...attributes, nextAction: stepWithParent.step.nextAction } as Step;

        if(stepWithParent.parentStep)
            stepWithParent.parentStep.nextAction = updatedStep;
        else
            clonedSourceStep = updatedStep;

        return clonedSourceStep;
    }
    
    duplicateAction(sourceStep: Step, stepName: string) : Step {
        let clonedSourceStep = JSON.parse(JSON.stringify(sourceStep));
    
        const stepWithParent = this.findStepByName(clonedSourceStep, stepName);
    
        if(!stepWithParent)
            throw new Error('Step can\'t be found!');
    
        const stepToDuplicate = stepWithParent.step;
        
        // Here we can create a clone of the step and change it's name, in case if the name was a unique identifier
    
        clonedSourceStep = this.addAction(clonedSourceStep, stepToDuplicate, stepName);
    
        return clonedSourceStep;
    }
    
    moveAction(sourceStep: Step, stepName: string, targetStepName: string) : Step {
        let clonedSourceStep = JSON.parse(JSON.stringify(sourceStep));
    
        if(stepName == targetStepName)
            return clonedSourceStep;
    
        const stepWithParent = this.findStepByName(clonedSourceStep, stepName);
    
        if(!stepWithParent)
            throw new Error('Step can\'t be found!');
    
        const stepToBeAdded = stepWithParent.step;
    
        clonedSourceStep = this.deleteAction(clonedSourceStep, stepToBeAdded.name);
    
        clonedSourceStep = this.addAction(clonedSourceStep, stepToBeAdded, targetStepName);
    
        return clonedSourceStep;
    }
    
    deleteAction(sourceStep: Step, stepName: string) : Step {
        const clonedSourceStep = JSON.parse(JSON.stringify(sourceStep));
    
        const stepWithParent = this.findStepByName(clonedSourceStep, stepName);
        
        if(!stepWithParent)
            return clonedSourceStep;
    
        if(stepWithParent.parentStep)
            stepWithParent.parentStep.nextAction = stepWithParent.step.nextAction;
        else
            return stepWithParent.step.nextAction as Step;
    
        return clonedSourceStep;
    }
    
    addAction(sourceStep: Step, step: SingleStep, name: string) : Step {
        const clonedSourceStep = JSON.parse(JSON.stringify(sourceStep))
    
        const targetStep = this.findStepByName(clonedSourceStep, name);
        
        if(!targetStep) 
            throw new Error('Step Can\'t be found!');
    
        targetStep.step.nextAction = { ...step, nextAction: targetStep.step.nextAction};
    
        return clonedSourceStep;
    }
    
    findStepByName(step: Step, name: string, parentStep?: Step) : StepWithParent | null {
        if(step.name == name)
            return { step, parentStep };
        else if(step.nextAction)
            return this.findStepByName(step.nextAction, name, step);
        else 
            return null;
    }
}
