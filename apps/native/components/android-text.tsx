import { type TextProps, Text, type TextStyle } from "react-native";
import { type ReactNode, forwardRef, useMemo } from "react";

type AndroidTextProps = TextProps & {
  children?: ReactNode;
};

export const AndroidText = forwardRef<Text, AndroidTextProps>(function AndroidText(
  { style, ...props },
  ref,
) {
  const mergedStyle = useMemo<TextStyle | TextStyle[]>(
    () => ({ includeFontPadding: false, textAlignVertical: "center", ...(style as TextStyle) }),
    [style],
  );
  return <Text ref={ref} {...props} style={mergedStyle} />;
});
