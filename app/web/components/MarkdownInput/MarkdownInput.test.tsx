import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SELECT_AN_IMAGE } from "components/constants";
import {
  IMAGE_DESCRIPTION,
  INSERT_IMAGE,
} from "components/MarkdownInput/constants";
import { useForm } from "react-hook-form";
import { service } from "service";
import wrapper from "test/hookWrapper";
import { MockedService } from "test/utils";

import MarkdownInput from "./MarkdownInput";

const uploadFileMock = service.api.uploadFile as MockedService<
  typeof service.api.uploadFile
>;

const Form = ({ submit }: { submit(value: string): void }) => {
  const { control, handleSubmit } = useForm();
  const onSubmit = handleSubmit(({ value }) => submit(value));
  return (
    <form onSubmit={onSubmit}>
      <h1 id="form-header">Form</h1>
      <MarkdownInput
        control={control}
        labelId="form-header"
        id="markdown-input"
        name="value"
        imageUpload
      />
      <input type="submit" />
    </form>
  );
};

describe("MarkdownInput", () => {
  it("has a working image upload button", async () => {
    const MOCK_FILE = new File([new Blob(["file content"])], "example.jpg", {
      type: "image/jpeg",
    });

    uploadFileMock.mockResolvedValue({
      file: MOCK_FILE,
      filename: "example.jpg",
      key: "key",
      thumbnail_url: "thumb.jpg",
      full_url: "full.jpg",
    });
    const onSubmit = jest.fn();

    render(<Form submit={onSubmit} />, { wrapper });

    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: INSERT_IMAGE }));
    const dialog = await screen.findByRole("dialog");
    await user.upload(
      within(dialog).getByLabelText(SELECT_AN_IMAGE),
      MOCK_FILE,
    );
    await user.type(
      within(dialog).getByLabelText(IMAGE_DESCRIPTION),
      "description",
    );
    await waitForElementToBeRemoved(dialog);
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("![](full.jpg)"));
  });
});
