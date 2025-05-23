import {
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  Select,
} from "@mui/material";
import Alert from "components/Alert";
import Button from "components/Button";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "components/Dialog";
import { FlagIcon } from "components/Icons";
import Snackbar from "components/Snackbar";
import TextField from "components/TextField";
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import { RpcError } from "grpc-web";
import { useTranslation } from "i18n";
import { GLOBAL } from "i18n/namespaces";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "react-query";
import { service } from "service";
import { ReportInput } from "service/reporting";
import { theme } from "theme";

export interface FlagButtonProps {
  contentRef: string;
  authorUser: string | number;
  className?: string;
}

export default function FlagButton({
  contentRef,
  authorUser,
  className,
}: FlagButtonProps) {
  const { t } = useTranslation(GLOBAL);

  const [isOpen, setIsOpen] = useState(false);
  const {
    control,
    handleSubmit,
    register,
    reset: resetForm,
    formState: { errors },
  } = useForm<ReportInput>();
  const {
    data: report,
    error,
    isLoading,
    mutate: reportContent,
    reset: resetMutation,
  } = useMutation<Empty, RpcError, ReportInput>(
    (formData) =>
      service.reporting.reportContent({ ...formData, contentRef, authorUser }),
    {
      onSuccess: () => {
        setIsOpen(false);
      },
    },
  );

  const handleClose = (
    event: unknown,
    reason: "backdropClick" | "escapeKeyDown" | "button",
  ) => {
    if (reason !== "button") return;
    resetForm();
    resetMutation();
    setIsOpen(false);
  };

  const onSubmit = handleSubmit((data) => {
    reportContent(data);
  });

  const handleFlagButtonClick = (event: { preventDefault: () => void }) => {
    event.preventDefault();
  };

  return (
    <>
      {report && (
        <Snackbar severity="success">
          {t("report.content.success_message")}
        </Snackbar>
      )}
      <div onClick={handleFlagButtonClick}>
        <IconButton
          aria-label={t("report.flag.button_aria_label")}
          className={className}
          onClick={() => setIsOpen(true)}
          color="primary"
          size="large"
        >
          <FlagIcon />
        </IconButton>
      </div>
      <Dialog
        aria-labelledby="content-reporter"
        open={isOpen}
        onClose={handleClose}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <DialogTitle id="content-reporter">
          {t("report.flag.title")}
        </DialogTitle>
        <form onSubmit={onSubmit}>
          <DialogContent>
            {error && <Alert severity="error">{error.message}</Alert>}
            <DialogContentText>{t("report.flag.explainer")}</DialogContentText>
            <FormControl
              variant="outlined"
              fullWidth
              margin="normal"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: theme.shape.borderRadius * 3,
                },
              }}
            >
              <InputLabel htmlFor="content-report-reason">
                {t("report.flag.reason_label")}
              </InputLabel>
              <Controller
                control={control}
                defaultValue={""}
                rules={{
                  validate: (v) => !!v || t("report.flag.reason_required"),
                }}
                name="reason"
                render={({ field }) => (
                  <Select
                    {...field}
                    variant="standard"
                    native
                    value={field.value}
                    label={t("report.flag.reason_label")}
                    id="content-report-reason"
                    onChange={field.onChange}
                    sx={{
                      "& + &": {
                        marginBlockStart: theme.spacing(2),
                      },
                    }}
                  >
                    {[
                      "",
                      t("report.flag.reason.spam"),
                      t("report.flag.reason.dating"),
                      t("report.flag.reason.external"),
                      t("report.flag.reason.commercial"),
                      t("report.flag.reason.harassment"),
                      t("report.flag.reason.fake"),
                      t("report.flag.reason.freeloading"),
                      t("report.flag.reason.guidelines_breach"),
                      t("report.flag.reason.other"),
                    ].map((option) => (
                      <option value={option} key={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                )}
              />
              <FormHelperText error={!!errors?.reason}>
                {errors?.reason?.message || t("report.flag.reason_helper")}
              </FormHelperText>
            </FormControl>
            <TextField
              id="content-report-description"
              {...register("description")}
              label={t("report.flag.description_label")}
              helperText={t("report.flag.description_helper")}
              fullWidth
              multiline
              minRows={4}
              maxRows={6}
              sx={{
                "& + &": {
                  marginBlockStart: theme.spacing(2),
                },
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button type="submit" loading={isLoading} onClick={onSubmit}>
              {t("submit")}
            </Button>
            <Button
              onClick={() => handleClose({}, "button")}
              variant="outlined"
              sx={{
                color: theme.palette.common.black,
                borderColor: theme.palette.grey[300],

                "&:hover": {
                  borderColor: theme.palette.grey[300],
                  backgroundColor: "#3135390A",
                },
              }}
            >
              {t("cancel")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
