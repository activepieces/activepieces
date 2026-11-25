---
id: referencing-step-outputs
title: "Referencing step outputs"
added: '2026-06-17'
order: 2
release: 0.85.4
---

Previously if you had a step called step_1 you would had to reference it "step_1['the_property_you_want']" but now you must reference it as "step_1['output']['the_property_you_want']", there is already a migration that will take care of this for you, but if you must abide by this new syntax if you are writing/editing step references manually not through the builder.
You can now also reference the step error via "step_1['error']", these changes come with the error handling feature.
Also step names there were shown on hover in the builder are now removed, you can right click the step and copy its reference instead.
