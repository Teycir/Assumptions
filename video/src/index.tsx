import { registerRoot, Composition } from "remotion";
import { AssumptionsPromo } from "./AssumptionsPromo";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="AssumptionsPromo"
        component={AssumptionsPromo}
        durationInFrames={1700}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

registerRoot(RemotionRoot);
