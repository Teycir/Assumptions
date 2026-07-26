import { formatFullName } from "./formatters";

describe("formatFullName", () => {
  it("formats full name correctly", () => {
    expect(formatFullName({ firstName: "Jane", lastName: "Doe" })).toBe("Jane Doe");
  });

  it("handles missing first or last name gracefully", () => {
    expect(formatFullName({ firstName: "", lastName: "Doe" })).toBe("Doe");
    expect(formatFullName({ firstName: "", lastName: "" })).toBe("Anonymous");
  });
});
