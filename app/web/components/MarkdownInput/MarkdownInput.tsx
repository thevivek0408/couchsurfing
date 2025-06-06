import ToastUIEditor from "@toast-ui/editor";
import dynamic from "next/dynamic";
import { MutableRefObject } from "react";
import { Control } from "react-hook-form";

const MarkdownInput = dynamic(
  () => import("components/MarkdownInput/MarkdownInputNoSSR"),
  {
    ssr: false,
  },
);

export default MarkdownInput;

export interface MarkdownInputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  defaultValue?: string;
  id: string;
  resetInputRef?: MutableRefObject<ToastUIEditor["reset"] | null>;
  labelId: string;
  name: string;
  imageUpload?: boolean;
  required?: string;
  autofocus?: boolean;
}
