# Heart-Risk Demo Verification Notes

The live desktop preview renders the Cardia heart-risk screening experience successfully. The interface shows the medical-disclaimer framing, eleven validated model inputs, acknowledgement requirement, supplied Electric Border animation around the result card, and an initially empty persisted-event ledger. The initial browser view also confirmed that no names or direct identifiers are requested by the form.

Initial browser interaction reached the acknowledgement control and submission area, but the first coordinate-based submit did not yet produce a model result or history event. The next verification step is to inspect and then explicitly toggle the consent control before submitting the representative non-identifying test profile.

Browser inspection confirmed the acknowledgement initially remained unchecked and the submit button was correctly disabled. A direct DOM-click attempt did not update the rendered state in this test session, so the next check will use the actual keyboard interaction path rather than simulating a DOM method call.

The real live interaction succeeded after acknowledging the educational-use notice. The server-side model returned a 7% positive-class probability, a 93% confidence measure, and a **Lower** model signal with a clear non-diagnostic clinician-handoff message. The screening ledger simultaneously updated to one persisted, de-identified event, confirming end-to-end validation, model inference, database write, and database read behavior.

The mobile viewport was also verified at 390 × 844 pixels. The hero copy, privacy statement, CTA sequence, and model-status card remain legible and vertically reflow without horizontal overflow.

The expanded animation set was verified after the latest integration. Desktop rendering shows the Pill Nav, masked hero reveal, scrolling velocity ribbon, animated process list, star-border link, Electric Border result treatment, and click/specular action controls without affecting the screening form. The 390 × 844 mobile view hides the dense pill links and desktop Line Sidebar while keeping the content in a single readable column. The production build completed successfully after the additions.

The final live interaction check confirmed that the specular-and-spark primary action remains keyboard/button accessible and continues to navigate into the screening experience. The animated process list exposes three real button controls. Reduced-motion handling now disables the non-essential button shine, navigation shifts, reveal transitions, star rays, velocity movement, hover transforms, click sparks, and WebGL animation while retaining static content and all form functionality.

An explicit browser-level reduced-motion verification passed. With `prefers-reduced-motion: reduce` emulated, `matchMedia` reported `true`, the velocity ribbon animation resolved to `none`, the specular action transition resolved to `0s`, and the masked-heading transform resolved to `none`. The browser preference was restored to normal after the check.

The reduced-motion verification was extended to the navigation system. Both the Line Sidebar transition and the Pill Nav hover-layer transition resolved to `0s`; the Line Sidebar transform resolved to `none`. This confirms the pointer-driven supplied-style navigation remains usable but static when reduced motion is requested.
