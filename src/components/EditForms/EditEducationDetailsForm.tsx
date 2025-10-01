'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Save, GraduationCap, Plus, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface EducationDetailsFormProps {
  applicationData: any;
  onSave: (data: any) => void;
  onChange: () => void;
  saving: boolean;
}

const EditEducationDetailsForm: React.FC<EducationDetailsFormProps> = ({
  applicationData,
  onSave,
  onChange,
  saving
}) => {
  const [formData, setFormData] = useState<any>({});
  const [programSelections, setProgramSelections] = useState<any[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  // Get the selected program details
  const selectedProgram = programSelections.find(p => p.selected) || programSelections[0];

  useEffect(() => {
    if (applicationData?.educationDetails) {
      setFormData(applicationData.educationDetails);
    }
    if (applicationData?.programSelections) {
      setProgramSelections(applicationData.programSelections);
    }
  }, [applicationData]);

  // Initialize form data based on program type and mode
  useEffect(() => {
    if (selectedProgram && !formData.educationData) {
      initializeFormData();
    }
  }, [selectedProgram]);

  const initializeFormData = () => {
    if (!selectedProgram) return;

    let initialData: any = { programDetails: selectedProgram };

    if (selectedProgram.programLevel === 'mba') {
      initialData = {
        ...initialData,
        educationData: [
          {
            examination: "SSLC/THSLC/CBSE",
            passedFailed: "Passed",
            groupSubject: "",
            yearOfPass: "",
            percentageMarks: "",
            registrationNumber: "",
            isCompulsory: true
          },
          {
            examination: "+2/VHSE",
            passedFailed: "Passed",
            groupSubject: "",
            yearOfPass: "",
            percentageMarks: "",
            registrationNumber: "",
            isCompulsory: true
          },
          {
            examination: "Degree",
            passedFailed: "Passed",
            groupSubject: "",
            yearOfPass: "",
            percentageMarks: "",
            registrationNumber: "",
            isCompulsory: true
          }
        ],
        achievements: "",
        collegeName: "",
        entranceExams: {
          kmat: { selected: false, score: "" },
          cmat: { selected: false, score: "" },
          cat: { selected: false, score: "" }
        }
      };
    } else if (selectedProgram.programLevel === 'diploma') {
      if (selectedProgram.mode === 'let' || selectedProgram.mode === 'LET') {
        initialData = {
          ...initialData,
          educationData: [
            {
              examination: "SSLC/THSLC/CBSE",
              passedFailed: "Passed",
              groupTrade: "",
              yearOfPass: "",
              percentageMarks: "",
              registrationNumber: "",
              noOfChances: "",
              english: "",
              physics: "",
              chemistry: "",
              maths: "",
              isCompulsory: true
            },
            {
              examination: "+2/VHSE",
              passedFailed: "",
              groupTrade: "",
              yearOfPass: "",
              percentageMarks: "",
              registrationNumber: "",
              noOfChances: "",
              english: "",
              physics: "",
              chemistry: "",
              maths: "",
              isCompulsory: false
            },
            {
              examination: "ITI",
              passedFailed: "",
              groupTrade: "",
              yearOfPass: "",
              percentageMarks: "",
              registrationNumber: "",
              noOfChances: "",
              english: "",
              physics: "",
              chemistry: "",
              maths: "",
              isCompulsory: false
            }
          ],
          subjectScores: [
            { examination: "+2/VHSE", physics: "", chemistry: "", maths: "", total: "", remarks: "" }
          ]
        };
      } else {
        // Regular and Part-time
        initialData = {
          ...initialData,
          educationData: [
            {
              examination: "SSLC/THSLC/CBSE",
              passedFailed: "Passed",
              groupTrade: "",
              yearOfPass: "",
              percentageMarks: "",
              registrationNumber: "",
              isCompulsory: true
            }
          ]
        };
      }
    }

    setFormData(initialData);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.educationData || formData.educationData.length === 0) {
      newErrors.education = 'Education details are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  // Available additional examinations
  const getAvailableExaminations = () => {
    if (selectedProgram?.programLevel === 'mba') {
      return [
        { value: "ITI", label: "ITI" },
        { value: "KGCE", label: "KGCE" },
        { value: "Diploma", label: "Diploma" },
        { value: "Post Graduate", label: "Post Graduate" }
      ];
    } else {
      return [
        { value: "+2/VHSE", label: "+2/VHSE" },
        { value: "ITI", label: "ITI" },
        { value: "KGCE", label: "KGCE" },
        { value: "Diploma", label: "Diploma" },
        { value: "Degree", label: "Degree" }
      ];
    }
  };

  // Add new examination
  const addExamination = (examinationType: string) => {
    const isForMBA = selectedProgram?.programLevel === 'mba';
    
    const newExamination = {
      examination: examinationType,
      passedFailed: "",
      ...(isForMBA ? {
        groupSubject: "",
        yearOfPass: "",
        percentageMarks: "",
        registrationNumber: "",
      } : {
        groupTrade: "",
        yearOfPass: "",
        percentageMarks: "",
        registrationNumber: "",
        noOfChances: "",
        english: "",
        physics: "",
        chemistry: "",
        maths: "",
      }),
      isCompulsory: false
    };

    setFormData({
      ...formData,
      educationData: [...(formData.educationData || []), newExamination]
    });
    onChange();
  };

  // Remove examination
  const removeExamination = (index: number) => {
    const updatedEducationData = [...(formData.educationData || [])];
    updatedEducationData.splice(index, 1);
    
    setFormData({
      ...formData,
      educationData: updatedEducationData
    });
    onChange();
  };

  // Get examinations that are already added
  const getAddedExaminations = () => {
    return (formData.educationData || []).map((exam: any) => exam.examination);
  };

  // Get available examinations that haven't been added yet
  const getAvailableToAdd = () => {
    const addedExams = getAddedExaminations();
    return getAvailableExaminations().filter(exam => !addedExams.includes(exam.value));
  };

  // Handle input changes for education data
  const handleEducationDataChange = (index: number, field: string, value: string) => {
    const updatedEducationData = [...(formData.educationData || [])];
    updatedEducationData[index] = {
      ...updatedEducationData[index],
      [field]: value
    };

    setFormData({
      ...formData,
      educationData: updatedEducationData
    });
    onChange();
  };

  // Handle changes for achievements and college name
  const handleTextChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    });
    onChange();
  };

  // Handle entrance exam changes
  const handleEntranceExamChange = (exam: string, field: string, value: any) => {
    setFormData({
      ...formData,
      entranceExams: {
        ...formData.entranceExams,
        [exam]: {
          ...formData.entranceExams?.[exam],
          [field]: value
        }
      }
    });
    onChange();
  };

  // Handle subject scores changes (for diploma LET)
  const handleSubjectScoreChange = (index: number, field: string, value: string) => {
    const updatedSubjectScores = [...(formData.subjectScores || [])];
    updatedSubjectScores[index] = {
      ...updatedSubjectScores[index],
      [field]: value
    };

    setFormData({
      ...formData,
      subjectScores: updatedSubjectScores
    });
    onChange();
  };

  // Render the appropriate form based on program type and mode
  const renderEducationForm = () => {
    if (!selectedProgram) {
      return (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              Please select a program first to configure education details.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header Info */}
        <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 p-4 border rounded-lg">
          <h3 className="text-sm md:text-base font-semibold text-gray-800 mb-2">
            Education Qualifications ({selectedProgram.programLevel === 'mba' ? 'MBA' : 'Diploma'})
          </h3>
          <p className="text-xs md:text-sm text-gray-600">
            Please provide details of your academic qualifications for {selectedProgram.programName} admission.
            {selectedProgram.programLevel === 'mba' ? (
              <span className="text-red-600 font-medium"> SSLC/THSLC/CBSE, +2/VHSE, and Degree are mandatory</span>
            ) : (
              <span className="text-red-600 font-medium"> SSLC/THSLC/CBSE is mandatory</span>
            )} for all applicants.
          </p>
        </div>

        {/* Education Cards */}
        <div className="space-y-2">
          {(formData.educationData || []).map((row: any, index: number) => (
            <Card key={index} className={`transition-all duration-200 hover:shadow-md ${
              row.isCompulsory ? 'ring-2 ring-red-100 border-red-200 bg-red-50/30' : 'border-gray-200'
            }`}>
              <CardHeader>
                <div className="flex justify-between sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span className="bg-primary/10 text-primary px-2 py-1.5 rounded-full text-xs font-medium">
                      {index + 1}
                    </span>
                    {row.examination}
                    {row.isCompulsory && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                    {!row.isCompulsory && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExamination(index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </CardTitle>
                  
                  {/* Status Badge - Mobile First */}
                  <div className="flex justify-start sm:justify-end">
                    {row.isCompulsory ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                        ✓ Passed
                      </Badge>
                    ) : (
                      <div className="w-full sm:w-auto sm:min-w-[120px]">
                        <Select
                          value={row.passedFailed}
                          onValueChange={(value) => handleEducationDataChange(index, 'passedFailed', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Passed">✓ Passed</SelectItem>
                            <SelectItem value="Failed">✗ Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-2">
                {renderEducationCardContent(row, index)}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Examination Section */}
        {getAvailableToAdd().length > 0 && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50/50">
            <div className="text-center space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Add Additional Qualification
                </h4>
                <p className="text-xs text-gray-500">
                  Add other educational qualifications if applicable
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2">
                {getAvailableToAdd().map((exam) => (
                  <Button
                    key={exam.value}
                    variant="outline"
                    size="sm"
                    onClick={() => addExamination(exam.value)}
                    className="h-8 text-xs border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add {exam.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Additional Information for MBA */}
        {selectedProgram.programLevel === 'mba' && (
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-800">
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Achievements */}
              <div className="space-y-2">
                <Label htmlFor="achievements" className="text-sm font-medium text-gray-700">
                  Achievements/Work Experience (if any)
                </Label>
                <Textarea
                  id="achievements"
                  value={formData.achievements || ""}
                  onChange={(e) => handleTextChange('achievements', e.target.value)}
                  className="w-full"
                  placeholder="Describe your achievements and work experience..."
                  rows={3}
                />
              </div>

              {/* College Name */}
              <div className="space-y-2">
                <Label htmlFor="college-name" className="text-sm font-medium text-gray-700">
                  Name of the College where UG was completed
                </Label>
                <Input
                  id="college-name"
                  value={formData.collegeName || ""}
                  onChange={(e) => handleTextChange('collegeName', e.target.value)}
                  className="w-full"
                  placeholder="Enter college name"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entrance Examinations for MBA */}
        {selectedProgram.programLevel === 'mba' && (
          <Card className="border-purple-200 bg-purple-50/30">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-purple-800">
                Entrance Examination Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* KMAT */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="kmat"
                      checked={formData.entranceExams?.kmat?.selected || false}
                      onCheckedChange={(checked) => 
                        handleEntranceExamChange('kmat', 'selected', checked === true)
                      }
                      className="cursor-pointer"
                    />
                    <Label htmlFor="kmat" className="text-sm font-medium text-purple-800">
                      KMAT
                    </Label>
                  </div>
                  {formData.entranceExams?.kmat?.selected && (
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Score</Label>
                      <Input
                        value={formData.entranceExams?.kmat?.score || ""}
                        onChange={(e) => handleEntranceExamChange('kmat', 'score', e.target.value)}
                        placeholder="Enter KMAT score"
                        type="number"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                {/* CMAT */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cmat"
                      checked={formData.entranceExams?.cmat?.selected || false}
                      onCheckedChange={(checked) => 
                        handleEntranceExamChange('cmat', 'selected', checked === true)
                      }
                      className="cursor-pointer"
                    />
                    <Label htmlFor="cmat" className="text-sm font-medium text-purple-800">
                      CMAT
                    </Label>
                  </div>
                  {formData.entranceExams?.cmat?.selected && (
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Score</Label>
                      <Input
                        value={formData.entranceExams?.cmat?.score || ""}
                        onChange={(e) => handleEntranceExamChange('cmat', 'score', e.target.value)}
                        placeholder="Enter CMAT score"
                        type="number"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                {/* CAT */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cat"
                      checked={formData.entranceExams?.cat?.selected || false}
                      onCheckedChange={(checked) => 
                        handleEntranceExamChange('cat', 'selected', checked === true)
                      }
                      className="cursor-pointer"
                    />
                    <Label htmlFor="cat" className="text-sm font-medium text-purple-800">
                      CAT
                    </Label>
                  </div>
                  {formData.entranceExams?.cat?.selected && (
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-600">Score</Label>
                      <Input
                        value={formData.entranceExams?.cat?.score || ""}
                        onChange={(e) => handleEntranceExamChange('cat', 'score', e.target.value)}
                        placeholder="Enter CAT score"
                        type="number"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-xs">i</span>
            </div>
            <div>
              <p className="font-medium mb-1">Important Notes:</p>
              <ul className="space-y-1 text-xs">
                {selectedProgram.programLevel === 'mba' ? (
                  <>
                    <li>• SSLC/THSLC/CBSE, +2/VHSE, and Degree qualifications are mandatory for MBA programs</li>
                    <li>• Fill in details for additional qualifications if applicable</li>
                    <li>• Entrance exam scores are optional but recommended</li>
                  </>
                ) : (
                  <>
                    <li>• SSLC/THSLC/CBSE qualification is mandatory for all diploma programs</li>
                    <li>• Fill in details for additional qualifications if applicable</li>
                  </>
                )}
                <li>• Ensure all information matches your certificates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render card content based on program type
  const renderEducationCardContent = (row: any, index: number) => {
    const isForMBA = selectedProgram?.programLevel === 'mba';
    
    return (
      <>
        {/* Form Grid - Responsive */}
        <div className={`grid gap-4 ${
          row.examination === "SSLC/THSLC/CBSE" && !isForMBA
            ? 'grid-cols-1 sm:grid-cols-3' 
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}>
          
          {/* Group/Subject - Not for SSLC/THSLC/CBSE */}
          {row.examination !== "SSLC/THSLC/CBSE" && (
            <div className="space-y-2">
              <Label htmlFor={`group-${index}`} className="text-sm font-medium text-gray-700">
                {isForMBA ? 
                  (row.examination === "Degree" ? "Subject/Course" : "Group/Subject") : 
                  "Group/Trade"
                }
              </Label>
              <Input
                id={`group-${index}`}
                value={isForMBA ? (row.groupSubject || "") : (row.groupTrade || "")}
                onChange={(e) => handleEducationDataChange(index, isForMBA ? 'groupSubject' : 'groupTrade', e.target.value)}
                className="w-full"
                placeholder={
                  isForMBA ? (
                    row.examination === "+2/VHSE" ? "e.g., Science, Commerce" :
                    row.examination === "Degree" ? "e.g., B.Tech, B.Com, BA" :
                    "Group/Subject"
                  ) : "e.g., Electronics, IT"
                }
              />
            </div>
          )}

          {/* Year of Pass */}
          <div className="space-y-2">
            <Label htmlFor={`year-${index}`} className="text-sm font-medium text-gray-700">
              Year of Passing
              {row.isCompulsory && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={`year-${index}`}
              value={row.yearOfPass || ""}
              onChange={(e) => handleEducationDataChange(index, 'yearOfPass', e.target.value)}
              className="w-full"
              placeholder="e.g., 2020"
              type="number"
              min="1950"
              max={new Date().getFullYear()}
            />
          </div>

          {/* Percentage */}
          <div className="space-y-2">
            <Label htmlFor={`percentage-${index}`} className="text-sm font-medium text-gray-700">
              Percentage (%)
              {row.isCompulsory && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              <Input
                id={`percentage-${index}`}
                value={row.percentageMarks || ""}
                onChange={(e) => handleEducationDataChange(index, 'percentageMarks', e.target.value)}
                className="w-full pr-8"
                placeholder="85.5"
                type="number"
                min="0"
                max="100"
                step="0.1"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                %
              </span>
            </div>
          </div>

          {/* Registration Number */}
          <div className="space-y-2">
            <Label htmlFor={`reg-${index}`} className="text-sm font-medium text-gray-700">
              Registration Number
              {row.isCompulsory && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={`reg-${index}`}
              value={row.registrationNumber || ""}
              onChange={(e) => handleEducationDataChange(index, 'registrationNumber', e.target.value)}
              className="w-full"
              placeholder="Registration number"
            />
          </div>

          {/* Subject Marks for Diploma programs */}
          {!isForMBA && (row.english || row.physics || row.chemistry || row.maths) && (
            <div className="col-span-full">
              <Label className="text-xs font-medium text-gray-700">Subject Marks</Label>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">English</Label>
                  <Input
                    value={row.english || ""}
                    onChange={(e) => handleEducationDataChange(index, 'english', e.target.value)}
                    placeholder="Grade"
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Physics</Label>
                  <Input
                    value={row.physics || ""}
                    onChange={(e) => handleEducationDataChange(index, 'physics', e.target.value)}
                    placeholder="Grade"
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Chemistry</Label>
                  <Input
                    value={row.chemistry || ""}
                    onChange={(e) => handleEducationDataChange(index, 'chemistry', e.target.value)}
                    placeholder="Grade"
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">Maths</Label>
                  <Input
                    value={row.maths || ""}
                    onChange={(e) => handleEducationDataChange(index, 'maths', e.target.value)}
                    placeholder="Grade"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-medium">Completion Status:</span>
            <div className="flex items-center gap-2">
              {[
                { field: 'yearOfPass', label: 'Year' },
                { field: 'percentageMarks', label: 'Percentage' },
                { field: 'registrationNumber', label: 'Reg. No.' }
              ].map(({ field, label }) => (
                <div key={field} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    row[field] ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className={row[field] ? 'text-green-600' : 'text-gray-400'}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };


  return (
    <div className="space-y-6">
      {renderEducationForm()}

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="space-y-1">
              {Object.values(errors).map((error, index) => (
                <p key={index} className="text-sm text-red-600">{error}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSubmit}
          disabled={saving || isLoading}
          className="bg-[#001c67] hover:bg-[#001c67]/90 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Education Details'}
        </Button>
      </div>
    </div>
  );
};

export default EditEducationDetailsForm;