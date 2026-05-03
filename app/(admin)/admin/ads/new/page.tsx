'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Calendar,
  Link2,
  Megaphone,
  Loader2,
  Video,
  Play,
  FileVideo,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Field, FieldLabel, FieldDescription, FieldError, FieldGroup } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/stores/auth-store';
import { createAdvertisement, uploadAdImage } from '@/lib/api/admin-ads';
import { getApiBaseUrl } from '@/lib/api/client';

const targetOptions = [
  { value: 'all', label: 'All Companies' },
  { value: 'free', label: 'Free Plan Only' },
  { value: 'basic', label: 'Basic Plan Only' },
  { value: 'pro', label: 'Pro Plan Only' },
  { value: 'enterprise', label: 'Enterprise Plan Only' },
  { value: 'custom', label: 'Select Specific Companies' },
];

const placementOptions = [
  { value: 'dashboard', label: 'Dashboard Banner', description: 'Shown on the main dashboard' },
  { value: 'pos', label: 'POS Screen', description: 'Shown on the point of sale screen' },
  { value: 'sidebar', label: 'Sidebar', description: 'Shown in the sidebar navigation' },
  { value: 'modal', label: 'Modal Popup', description: 'Shown as a popup on login' },
];

export default function NewAdPage() {
  const router = useRouter();
  const token = useAuthStore(state => state.token);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: '',
    mediaType: 'image' as 'image' | 'video',
    linkUrl: '',
    target: 'all',
    placements: ['dashboard'],
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handlePlacementToggle = (placement: string) => {
    const newPlacements = formData.placements.includes(placement)
      ? formData.placements.filter(p => p !== placement)
      : [...formData.placements, placement];
    handleChange('placements', newPlacements);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.placements.length === 0) newErrors.placements = 'Select at least one placement';

    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      toast.error('Please upload an image or video file');
      return;
    }

    // Validate file size (50MB for video, 5MB for image)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    setIsUploading(true);
    try {
      if (!token) throw new Error('Not authenticated');
      const { image_url, media_type } = await uploadAdImage(token, file);
      setFormData(prev => ({
        ...prev,
        imageUrl: image_url,
        mediaType: media_type
      }));
      toast.success(`${media_type === 'video' ? 'Video' : 'Image'} uploaded successfully`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload media');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);

    try {
      if (!token) throw new Error('Not authenticated');
      
      await createAdvertisement(token, {
        title: formData.title,
        content: formData.content,
        image_url: formData.imageUrl,
        media_type: formData.mediaType,
        link_url: formData.linkUrl,
        target: formData.target,
        placements: formData.placements,
        start_date: new Date(formData.startDate).toISOString(),
        end_date: new Date(formData.endDate).toISOString(),
        is_active: formData.isActive,
      });

      toast.success('Advertisement created successfully');
      router.push('/admin/ads');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create advertisement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/ads">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Advertisement</h1>
          <p className="text-muted-foreground">
            Create a new ad to display across the platform
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Ad Content</CardTitle>
                <CardDescription>Basic information about your advertisement</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="title">Title *</FieldLabel>
                    <Input
                      id="title"
                      placeholder="Enter ad title"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                    />
                    {errors.title && <FieldError>{errors.title}</FieldError>}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="content">Content *</FieldLabel>
                    <Textarea
                      id="content"
                      placeholder="Enter ad content or description"
                      value={formData.content}
                      onChange={(e) => handleChange('content', e.target.value)}
                      rows={4}
                    />
                    <FieldDescription>This text will be displayed in the ad</FieldDescription>
                    {errors.content && <FieldError>{errors.content}</FieldError>}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="linkUrl">Link URL</FieldLabel>
                    <div className="relative">
                      <Link2 className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="linkUrl"
                        placeholder="https://example.com/landing-page"
                        value={formData.linkUrl}
                        onChange={(e) => handleChange('linkUrl', e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <FieldDescription>Where users will be redirected when clicking the ad</FieldDescription>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Media */}
            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
                <CardDescription>Upload an image or video for your advertisement</CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer relative overflow-hidden"
                  onClick={handleFileClick}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  
                  {formData.imageUrl ? (
                    <div className="space-y-4">
                      <div className="relative aspect-video max-w-md mx-auto overflow-hidden rounded-lg border bg-black flex items-center justify-center">
                        {formData.mediaType === 'video' ? (
                          <video 
                            src={`${getApiBaseUrl()}${formData.imageUrl}`} 
                            className="max-h-full w-full"
                            controls
                          />
                        ) : (
                          <img 
                            src={`${getApiBaseUrl()}${formData.imageUrl}`} 
                            alt="Preview" 
                            className="object-cover w-full h-full"
                          />
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 size-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChange('imageUrl', '');
                          }}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">Click to change media</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
                        {isUploading ? (
                          <Loader2 className="size-6 text-primary animate-spin" />
                        ) : (
                          <div className="flex gap-1">
                            <ImageIcon className="size-5 text-muted-foreground" />
                            <FileVideo className="size-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {isUploading ? 'Uploading...' : 'Drop image or video here or click to upload'}
                        </p>
                        <p className="text-sm text-muted-foreground">Image (5MB) or Video (50MB)</p>
                      </div>
                      <Button type="button" variant="outline" disabled={isUploading}>
                        {isUploading ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 size-4" />
                        )}
                        {isUploading ? 'Uploading...' : 'Upload Media'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Placement */}
            <Card>
              <CardHeader>
                <CardTitle>Placement</CardTitle>
                <CardDescription>Where should this ad be displayed?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {placementOptions.map((placement) => {
                    const isSelected = formData.placements.includes(placement.value);
                    return (
                      <button
                        key={placement.value}
                        type="button"
                        onClick={() => handlePlacementToggle(placement.value)}
                        className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors w-full ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-accent hover:border-primary/50'
                        }`}
                      >
                        <span
                          className={`mt-0.5 size-4 shrink-0 rounded-[4px] border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-input bg-transparent'
                          }`}
                        >
                          {isSelected && (
                            <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="2,6 5,9 10,3" />
                            </svg>
                          )}
                        </span>
                        <div>
                          <p className="font-medium">{placement.label}</p>
                          <p className="text-sm text-muted-foreground">{placement.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.placements && <p className="mt-2 text-sm text-destructive">{errors.placements}</p>}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Target Audience */}
            <Card>
              <CardHeader>
                <CardTitle>Target Audience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Select value={formData.target} onValueChange={(v) => handleChange('target', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target audience" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Who should see this ad?</p>
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="startDate">Start Date *</FieldLabel>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => handleChange('startDate', e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    {errors.startDate && <FieldError>{errors.startDate}</FieldError>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="endDate">End Date *</FieldLabel>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => handleChange('endDate', e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    {errors.endDate && <FieldError>{errors.endDate}</FieldError>}
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Active on Save</p>
                    <p className="text-sm text-muted-foreground">Start showing immediately</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(v) => handleChange('isActive', v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Megaphone className="mr-2 size-4" />
                    Create Advertisement
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href="/admin/ads">
                  <X className="mr-2 size-4" />
                  Cancel
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
