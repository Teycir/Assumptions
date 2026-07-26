// Fixture: false-positive-middleware
// Handler accesses req.body after explicit Zod schema validation middleware.

import { validateBody, userUpdateSchema } from "./validation-middleware";
import { db } from "./db";

app.patch("/user/profile", validateBody(userUpdateSchema), async (req, res) => {
  const updated = await db.users.update({
    where: { id: req.user.id },
    data: {
      email: req.body.email,
      name: req.body.name,
    },
  });

  res.json(updated);
});
