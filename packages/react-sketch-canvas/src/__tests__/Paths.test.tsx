import { line } from "../Paths";

describe("Helper functions", () => {
  it("Line", () => {
    const pointA = {
      x: 0,
      y: 0,
    };
    const pointB = {
      x: 0,
      y: 0,
    };

    const details = line(pointA, pointB);

    expect(details).toEqual({
      length: 0,
      angle: 0,
    });
  });
});
