import React, { useState, useEffect, useRef } from "react";
import { Button, ButtonClickEvent, Input, Form, TextArea, MultiImageUploader, Select, SelectOption } from "@fider/components";
import { SignInModal } from "@fider/components";
import { cache, actions, Failure } from "@fider/services";
import { ImageUpload, ModuleNames } from "@fider/models";
import { useFider } from "@fider/hooks";

interface PostInputProps {
  placeholder: string;
  onTitleChanged: (title: string) => void;
  onDescriptionChanged: (description: string) => void;
}

const CACHE_MODULE_KEY = "PostInput-Module";
const CACHE_TITLE_KEY = "PostInput-Title";
const CACHE_DESCRIPTION_KEY = "PostInput-Description";

export const PostInput = (props: PostInputProps) => {
  const getCachedValue = (key: string): string => {
    if (fider.session.isAuthenticated) {
      return cache.session.get(key) || "";
    }
    return "";
  };

  const fider = useFider();
  const titleRef = useRef<HTMLInputElement>();
  const [moduleName, setModuleName] = useState(getCachedValue(CACHE_MODULE_KEY));
  const [title, setTitle] = useState(getCachedValue(CACHE_TITLE_KEY));
  const [description, setDescription] = useState(getCachedValue(CACHE_DESCRIPTION_KEY));
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [attachments, setAttachments] = useState<ImageUpload[]>([]);
  const [error, setError] = useState<Failure | undefined>(undefined);

  useEffect(() => {
    props.onTitleChanged(title);
  }, [title]);

  useEffect(() => {
    props.onDescriptionChanged(description);
  }, [description]);

  const handleTitleFocus = () => {
    if (!fider.session.isAuthenticated && titleRef.current) {
      titleRef.current.blur();
      setIsSignInModalOpen(true);
    }
  };

  const handleTitleChange = (value: string) => {
    cache.session.set(CACHE_TITLE_KEY, value);
    setTitle(value);
    props.onTitleChanged(value);
  };

  const hideModal = () => setIsSignInModalOpen(false);
  const clearError = () => setError(undefined);

  const handleDescriptionChange = (value: string) => {
    cache.session.set(CACHE_DESCRIPTION_KEY, value);
    setDescription(value);
    props.onDescriptionChanged(value);
  };

  const submit = async (event: ButtonClickEvent) => {
    if (title && description) {
      const result = await actions.createPost(title, description, attachments);
      if (result.ok) {
        clearError();
        cache.session.remove(CACHE_TITLE_KEY, CACHE_DESCRIPTION_KEY);
        location.href = `/posts/${result.data.number}/${result.data.slug}`;
        event.preventEnable();
      } else if (result.error) {
        setError(result.error);
      }
    }
  };

  const details = () => (
    <>
      <TextArea
        field="description"
        onChange={handleDescriptionChange}
        value={description}
        minRows={5}
        placeholder="Describe your suggestion"
      />
      <MultiImageUploader field="attachments" maxUploads={3} previewMaxWidth={100} onChange={setAttachments} />
      <Button type="submit" color="positive" onClick={submit}>
        Submit
      </Button>
    </>
  );

  const options = ModuleNames.All.map(s => ({
    value: s.value.toString(),
    label: s.title
  }));

  const handleModuleNameChange = (opt?: SelectOption) => {
    if (opt) {
      cache.session.set(CACHE_MODULE_KEY, opt.value);
      setModuleName(opt.value);
    }
  };

  return (
    <>
      <SignInModal isOpen={isSignInModalOpen} onClose={hideModal} />
      <Form error={error}>

        <Select
          field="module"
          label="Module"
          defaultValue={moduleName}
          options={options}
          onChange={handleModuleNameChange}
        />

        <Input
          field="title"
          noTabFocus={!fider.session.isAuthenticated}
          inputRef={titleRef}
          onFocus={handleTitleFocus}
          maxLength={100}
          value={title}
          onChange={handleTitleChange}
          placeholder="Title (Short & Descriptive)"
        />
        {details()}
      </Form>
    </>
  );
};
