# Project Rules

## File size

- Every project-owned code file must contain no more than 300 lines of code, excluding blank lines and comment-only lines.
- Apply this limit to source code, UI markup, styles, scripts, and tests.
- Before a change would exceed this limit, split the file into focused modules or components with clear responsibilities.
- Do not bypass the limit by compressing statements onto fewer lines or reducing readability.
- Check the affected files against this limit before finishing a change.
- Third-party dependencies, generated files, and dependency lockfiles are excluded. Do not classify hand-written code as generated to bypass the limit.

## SOLID architecture

- Follow SOLID principles in all project-owned code, including modules and functions as well as classes.
- Single Responsibility: give each module, class, and component one clear responsibility and reason to change. Separate game rules, networking, input, rendering, and UI concerns.
- Open/Closed: extend behavior through focused collaborators and composition rather than repeatedly expanding shared conditionals or central classes.
- Liskov Substitution: implementations of a shared contract must preserve its expected behavior, inputs, outputs, and error guarantees.
- Interface Segregation: keep contracts small and specific to their consumers; do not force components to depend on methods they do not use.
- Dependency Inversion: keep core game rules independent of rendering frameworks, network transports, storage, and other external systems. Supply those dependencies through explicit contracts at system boundaries.
- Prefer composition over inheritance. Add abstractions when they clarify a responsibility or isolate a dependency; avoid speculative layers and unnecessary class hierarchies.
- Test game rules independently of rendering and networking, and test shared contracts where implementations must be interchangeable.
- Review changes for SOLID compliance and the 300-line file limit before finishing.
