# How Anthropic Teams Use Claude Code

**Source:** How-Anthropic-teams-use-Claude-Code_v2.pdf  
**Document Version:** 2.0

---

## Overview

This document captures how different teams at Anthropic use Claude Code in their daily work, including their main use cases, workflows, team impact, and top tips.

---

## Claude Code for Product Development

### Team Overview

The product development team builds Claude and its interfaces. They extensively use Claude Code for daily development tasks.

### Main Use Cases

#### Feature file workflow
The team creates feature files containing step-by-step instructions that define the expected behavior of new features. Claude Code helps create and interpret these files through test-driven development (TDD), where expected behaviors are written first and Claude executes against those expectations until all criteria are met.

#### End-to-end testing
Claude Code writes user stories and automatically creates end-to-end test cases for complex features, catching edge cases humans might miss. The team treats tests as a primary artifact for verifying code correctness, allowing quicker identification and correction of issues.

#### Full-stack development
When working on customer-facing changes, Claude Code generates new React components, updates database schemas, and modifies API routes. The team provides Claude with a well-defined subtask and lets it implement across the full stack.

#### Code review assistance
Claude Code helps identify edge cases and refactoring opportunities, pointing to potential pitfalls or suggesting improvements that can make code more robust and maintainable.

### Team Impact

- **Accelerated development cycles**: Features that once took weeks can now be completed more quickly with Claude Code handling repetitive implementation work.
- **Improved code quality through tests**: Test-driven development with Claude Code catches its own mistakes, especially effective when you ask Claude to generate tests before writing code.

### Top Tips from Product Development Team

#### Develop task classification intuition
Learn to distinguish between tasks that work well asynchronously (peripheral features, prototyping) versus those needing synchronous supervision (core business logic, critical fixes). Abstract tasks on the product's edges can be handled with "auto-accept mode," while core functionality requires closer oversight.

#### Form clear, detailed prompts
When components have similar names or functions, be extremely specific in your requests. The better and more detailed your prompt, the more you can trust Claude to work independently without unexpected changes to the wrong parts of the code base.

---

## Claude Code for Security Engineering

### Team Overview

The Security Engineering team focuses on securing the software development lifecycle, supply chain security, and development environment security. They use Claude Code extensively for writing and debugging code.

### Main Use Cases

#### Complex infrastructure debugging
When working on incidents, they feed Claude Code stack traces and documentation, asking it to trace control flow through the code base. This significantly reduces time-to-resolution for production issues, allowing them to understand problems that would normally take 10-15 minutes of manual code scanning in about 5 minutes.

#### Terraform code review and analysis
For infrastructure changes requiring security approval, they copy Terraform plans into Claude Code to ask "what's this going to do? Am I going to regret this?" This creates tighter feedback loops and makes it easier for the security team to quickly review and approve infrastructure changes, reducing bottlenecks in the development process.

#### Documentation synthesis and runbooks
They have Claude Code ingest multiple documentation sources and create markdown runbooks, troubleshooting guides, and overviews. They use these condensed documents as context for debugging real issues, creating a more efficient workflow than searching through full knowledge bases.

#### Test-driven development workflow
Instead of their previous "design doc → janky code → refactor → give up on tests" pattern, they now ask Claude Code for pseudocode, guide it through test-driven development, and periodically check in to steer it when stuck, resulting in more reliable and testable code.

#### Context switching and project onboarding
When contributing to existing projects like "dependant" (a web application for security approval workflows), they use Claude Code to write, review, and execute specifications written in markdown and stored in the codebase, enabling meaningful contributions within days instead of weeks.

### Team Impact

- **Reduced incident resolution time**: Infrastructure debugging that normally takes 10-15 minutes of manual code scanning now takes about 5 minutes.
- **Improved security review cycle**: Terraform code reviews for security approval happen much faster, eliminating developer blocks while waiting for security team approval.
- **Enhanced cross-functional contribution**: Team members can meaningfully contribute to projects within days instead of weeks of context building.
- **Better documentation workflow**: Synthesized troubleshooting guides and runbooks from multiple sources create more efficient debugging processes.

### Top Tips from Security Engineering Team

#### Use custom slash commands extensively
Security engineering uses 50% of all custom slash command implementations in the entire monorepo. These custom commands streamline specific workflows and speed up repeated tasks.

#### Let Claude talk first
Instead of asking targeted questions for code snippets, they now tell Claude Code to "commit your work as you go" and let it work autonomously with periodic check-ins, resulting in more comprehensive solutions.

#### Leverage it for documentation
Beyond coding, Claude Code excels at synthesizing documentation and creating structured outputs. They provide writing samples and formatting preferences to get documents they can immediately use in Slack, Google Docs, and other tools to avoid interface switching fatigue.

---

## Claude Code for Inference

### Team Overview

The Inference team manages the memory system that stores information while Claude reads your prompt and generates its response. Team members, especially those who are new to machine learning, can use Claude Code extensively to bridge that knowledge gap and accelerate their work.

### Main Use Cases

#### Codebase comprehension and onboarding
The team relies heavily on Claude Code to quickly understand the architecture when joining a complex codebase. Instead of manually searching GitHub repos, they ask Claude to find which files call specific functionalities, getting results in seconds rather than asking colleagues or searching manually.

#### Unit test generation with edge case coverage
After writing core functionality, they ask Claude to write comprehensive unit tests. Claude automatically includes missed edge cases, completing what would normally take significant mental energy in minutes, acting like a coding assistant they can review.

#### Machine learning concept explanation
Without a machine learning background, team members depend on Claude to explain model-specific functions and settings. What would require an hour of Google searching and reading documentation now takes 10-20 minutes, reducing research time by 80%.

#### Cross-language code translation
When testing functionality in different programming languages, they explain what they want to test and Claude writes the logic in the required language (like Rust), eliminating the need to learn new languages just for testing purposes.

#### Command recall and Kubernetes management
Instead of remembering complex Kubernetes commands, they ask Claude for the correct syntax, like "how to get all pods or deployment status," and receive the exact commands needed for their infrastructure work.

### Team Impact

- **Accelerated ML concept learning**: Research time reduced by 80% — what took an hour of Google searching now takes 10-20 minutes.
- **Faster codebase navigation**: Can find relevant files and understand system architecture in seconds instead of asking colleagues.
- **Comprehensive test coverage**: Claude automatically generates unit tests with edge cases, relieving mental burden while maintaining code quality.
- **Language barrier elimination**: Can implement functionality in unfamiliar languages like Rust without needing to learn it.

### Top Tips from Inference Team

#### Test knowledge base functionality first
Try asking various questions to see if Claude can answer faster than Google search. If it's faster and more accurate, it's a valuable time-saving tool for your workflow.

#### Start with code generation
Give Claude specific instructions and ask it to write logic, then verify correctness. This helps build trust in the tool's capabilities before using it for more complex tasks.

#### Use it for test writing
Having Claude write unit tests relieves significant pressure from daily development work. Leverage this feature to maintain code quality without spending time thinking through all test cases manually.

---

## Claude Code for Fine-Tuning

### Team Overview

The Fine-Tuning team works on training models with paired input-output examples to be better at specific tasks.

### Main Use Cases

#### Managing experimental tracking
They use Claude Code to check training runs, iterate on code, and manage many logs from multiple experiments. The team handles numerous active runs, and Claude Code can quickly navigate training dashboards by reading log files and identifying specific run characteristics or errors on demand.

#### Tool building for experimentation
When team members need specialized tools for experiments (like a "vibe check" interface to manually review examples), Claude Code helps build these tools in a single session. Non-developers can create their own scripts for specific workflows, accessing capabilities previously requiring engineering support.

#### Code review and debugging
Claude Code assists with catching issues in dataset preparation scripts and experiment configurations. The team uses it to debug distributed training challenges and validate that data pipelines are working correctly before starting long-running training jobs.

#### Metric analysis and visualization
They use Claude Code to generate performance metrics and create comparative charts. For research presentations, they can quickly generate bar charts showing model performance differences, enabling rapid performance visualization without deep knowledge of data visualization libraries.

### Team Impact

- **Faster experiment iteration**: Can build custom tooling in single sessions instead of waiting for engineering support.
- **Reduced debugging time**: Catches issues in data pipelines before expensive training runs.
- **Democratized tooling**: Non-developers can create their own workflows and analysis scripts.
- **Accelerated presentation prep**: Quick generation of performance visualizations and metrics.

### Top Tips from Fine-Tuning Team

#### Create experiment-specific workspaces
Keep separate Claude Code sessions for different experiments, allowing context-specific assistance without confusion between projects.

#### Validate before long runs
Always use Claude Code to validate data pipelines and configurations before starting multi-hour training runs to avoid costly mistakes.

#### Use for ad-hoc analysis
When you need quick insights from experiment logs or metrics, describe what you're looking for and let Claude Code parse and summarize the relevant information.

---

## Claude Code for RL Engineering

### Team Overview

The RL (Reinforcement Learning) Engineering team works on RLHF (Reinforcement Learning from Human Feedback) and related training systems.

### Main Use Cases

#### State inspection tooling
They use Claude Code to track down issues across training jobs. When faced with logs containing model states, Claude Code can quickly parse and identify issues, reducing time spent manually checking training configurations and outputs.

#### Multi-process coordination
RL systems require coordination across many processes. Claude Code helps manage and debug distributed systems, writing scripts to monitor process health and identify coordination failures.

#### Metric pipeline development
They use Claude Code to build metrics pipelines for experiments, automating the extraction and visualization of training signals like reward curves and loss values.

#### Test harness development
Claude Code helps write test frameworks for RL system components, ensuring that training stability and expected behavior are validated before production deployment.

### Team Impact

- **Faster debugging cycles**: Complex distributed system issues identified more quickly.
- **Automated monitoring**: Scripts that track training health without manual oversight.
- **Improved test coverage**: More comprehensive testing of RL components.
- **Streamlined metrics**: Automated extraction and visualization of training signals.

### Top Tips from RL Engineering Team

#### Customize your Claude.md file for specific patterns
Add instructions to your Claude.md file to prevent Claude from making repeated tool-calling mistakes, such as telling it to "run pytest not run and don't cd unnecessarily – just use the right path." This significantly improved consistency.

#### Use a checkpoint-heavy workflow
Regularly commit your work as Claude makes changes so you can easily roll back when experiments don't work out. This enables a more experimental approach to development without risk.

#### Try one-shot first, then collaborate
Give Claude a quick prompt and let it attempt the full implementation first. If it works (about one-third of the time), you've saved significant time. If not, then switch to a more collaborative, guided approach.

---

## Claude Code for Legal

### Team Overview

The Legal team discovered Claude Code's potential through experimentation, and a desire to learn about Anthropic's product offerings. Additionally, one team member had a personal use case related to creating accessibility tools for family and work prototypes that demonstrate the technology's power for non-developers.

### Main Use Cases

#### Custom accessibility solution for family members
Team members have built communication assistants for family members with speaking difficulties due to medical diagnoses. In just one hour, they created a predictive text app using native speech-to-text that suggests responses and speaks them using voice banks, solving gaps in existing accessibility tools recommended by speech therapists.

#### Legal department workflow automation
They created prototype "phone tree" systems to help team members connect with the right lawyer at Anthropic, demonstrating how legal departments can build custom tools for common tasks without traditional development resources.

#### Team coordination tools
Managers have built G Suite applications that automate weekly team updates and track legal review status across products, allowing lawyers to quickly flag items needing review through simple button clicks rather than spreadsheet management.

#### Rapid prototyping for solution validation
They use Claude Code to quickly build functional prototypes they can show to domain experts (like showing accessibility tools to UCSF specialists) to validate ideas and identify existing solutions before investing more time.

### Workstyle and Impact

#### Planning in Claude.ai, building in Claude Code
They use a two-step process where they brainstorm and plan with Claude.ai first, then move to Claude Code for implementation, asking it to slow down and work step-by-step rather than outputting everything at once.

#### Visual-first approach
They frequently use screenshots to show Claude Code what they want interfaces to look like, then iterate based on visual feedback rather than describing features in text.

#### Prototype-driven innovation
They emphasize overcoming the fear of sharing "silly" or "toy" prototypes, as these demonstrations inspire others to see possibilities they hadn't considered.

#### Security and compliance awareness
As product lawyers, they immediately identify security implications of deep MCP integrations, noting how conservative security postures will create barriers as AI tools access more sensitive systems.

#### Compliance tooling priorities
They advocate for building compliance tools quickly as AI capabilities expand, recognizing the balance between innovation and risk management.

### Top Tips from Legal Department

#### Plan extensively in Claude.ai first
Use Claude's conversational interface to flesh out your entire idea before moving to Claude Code. Then ask Claude to summarize everything into a step-by-step prompt for implementation.

#### Work incrementally and visually
Ask Claude Code to slow down and implement one step at a time so you can copy-paste without getting overwhelmed. Use screenshots liberally to show what you want interfaces to look like.

#### Share prototypes despite imperfection
Overcome the urge to hide "toy" projects or unfinished work — sharing prototypes helps others see possibilities and sparks innovation across departments that don't typically interact.

---

## Summary: Key Themes Across Teams

### Common Patterns

1. **Test-driven development**: Multiple teams emphasize writing tests first
2. **Checkpoint workflows**: Regular commits enable safe experimentation  
3. **Custom configurations**: Teams customize Claude.md for their specific needs
4. **Documentation synthesis**: Using Claude to create runbooks and guides
5. **Prototype sharing**: Overcoming reluctance to share early-stage work

### Time Savings

| Team | Task | Time Reduction |
|------|------|----------------|
| Security Engineering | Infrastructure debugging | 10-15 min → 5 min |
| Inference | ML concept research | 1 hour → 10-20 min (80%) |
| RL Engineering | Experiment validation | Hours → Minutes |
| Legal | Prototype building | Days → Hours |

### Universal Tips

- Start with one-shot attempts before collaborative guidance
- Use specific, detailed prompts
- Leverage Claude for documentation beyond coding
- Build trust through verification before relying on output
- Create custom commands for repeated workflows

---

*Document generated from: How-Anthropic-teams-use-Claude-Code_v2.pdf*
